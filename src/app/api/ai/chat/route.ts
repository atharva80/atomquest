import { createClient } from '@/lib/supabase/server';
import { getActiveCycle } from '@/queries/cycles';
import { getOverallScore, calculateProgressScore } from '@/lib/utils';
import { GoalWithCheckins } from '@/types';
import { NextResponse } from 'next/server';

// Force dynamic execution since we use headers/cookies
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse request
    const body = await req.json().catch(() => ({}));
    const { message, history = [] } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 3. Fetch active cycle & profile & goals
    const cycle = await getActiveCycle();
    if (!cycle) {
      return NextResponse.json({ error: 'No active cycle found' }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
    }

    const { data: goals } = await supabase
      .from('goals')
      .select(`
        *,
        quarterly_checkins (*)
      `)
      .eq('profile_id', user.id)
      .eq('cycle_id', cycle.id)
      .order('created_at', { ascending: true });

    const typedGoals = (goals || []) as GoalWithCheckins[];
    const overallScore = getOverallScore(typedGoals) * 100;

    const geminiKey = process.env.GEMINI_API_KEY;

    // Check if we should use mock simulation mode
    if (!geminiKey || geminiKey.trim() === '' || geminiKey.startsWith('re_') || geminiKey === 'your-gemini-key') {
      const mockResponse = generateMockChatResponse(profile, typedGoals, overallScore, message);
      return createSimulatedStreamResponse(mockResponse);
    }

    // Otherwise, call the real Gemini 1.5 Flash stream endpoint!
    // We inject the entire goal sheet context into the system instructions!
    const goalsContext = typedGoals.map(g => {
      const latestCheckin = g.quarterly_checkins?.sort((a: any, b: any) => b.quarter.localeCompare(a.quarter))[0];
      return {
        id: g.id,
        title: g.title,
        description: g.description,
        weightage: g.weightage,
        uom: g.uom_type,
        target: g.target,
        latest_achievement: latestCheckin?.achievement ?? null,
        achievement_status: latestCheckin?.status ?? 'not_started',
        status: g.status
      };
    });

    const systemInstruction = `
      You are 'AtomQuest AI Coach', a warm, friendly, and expert performance advisor at Atomberg Technologies.
      The employee you are chatting with is ${profile.first_name} ${profile.last_name}.
      Their current role is listed as: ${profile.role}.
      Here is their active goal sheet context:
      - Active Performance Cycle: ${cycle.name}
      - Goals List: ${JSON.stringify(goalsContext, null, 2)}
      - Current Overall Weighted Progress Score: ${overallScore.toFixed(1)}%
      
      Response guidelines:
      - You have full context of their goals, targets, and progress. Use this to answer queries like "how is my score calculated?", "which of my goals is at risk?", or "how can I improve?".
      - Keep answers concise, actionable, and encouraging (max 3 sentences).
      - Do not invent goals or data not present in the goal sheet.
      - Speak directly to the employee.
      - Always tie advice back to Atomberg's focus on engineering excellence and consumer-centric innovation.
    `;

    // Map message history to Gemini API format
    const contents = [];
    
    // Add past history (limit to last 6 messages to keep tokens small)
    const recentHistory = history.slice(-6);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini stream API responded with status ${response.status}`);
      }

      // Read from fetch stream and transform to simple client stream
      const reader = response.body?.getReader();
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('ReadableStream not available from Gemini response');
      }

      const clientStream = new ReadableStream({
        async start(controller) {
          let buffer = '';
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunkText = decoder.decode(value, { stream: true });
              buffer += chunkText;

              let lastMatchEnd = 0;
              let match;
              // Regex to match "text": "..." securely in Gemini's chunk streams
              const regex = /"text":\s*"((?:[^"\\]|\\.)*)"/g;
              while ((match = regex.exec(buffer)) !== null) {
                const textVal = match[1];
                try {
                  const unescaped = JSON.parse('"' + textVal + '"');
                  if (unescaped) {
                    controller.enqueue(encoder.encode(unescaped));
                  }
                  lastMatchEnd = regex.lastIndex;
                } catch (e) {
                  // Incomplete or broken chunk sequence, keep buffering
                }
              }
              if (lastMatchEnd > 0) {
                buffer = buffer.slice(lastMatchEnd);
              }
            }
          } catch (e) {
            console.error('Error reading Gemini stream:', e);
            controller.enqueue(encoder.encode(' [Error in AI stream generation] '));
          } finally {
            controller.close();
          }
        }
      });

      return new Response(clientStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });

    } catch (apiError) {
      console.error('Gemini stream failed, falling back to simulated chatbot response:', apiError);
      const mockResponse = generateMockChatResponse(profile, typedGoals, overallScore, message);
      return createSimulatedStreamResponse(mockResponse + " (Note: Running in simulated backup mode)");
    }

  } catch (error) {
    console.error('Error in chatbot route handler:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Simulated typing stream helper
function createSimulatedStreamResponse(text: string) {
  const encoder = new TextEncoder();
  const words = text.split(/(\s+)/);
  let wordIndex = 0;

  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        if (wordIndex < words.length) {
          const chunk = words[wordIndex];
          controller.enqueue(encoder.encode(chunk));
          wordIndex++;
        } else {
          clearInterval(interval);
          controller.close();
        }
      }, 35); // Extremely premium, lag-free fluid word typing experience!
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Sophisticated dynamic chatbot assistant
function generateMockChatResponse(profile: any, goals: GoalWithCheckins[], overallScore: number, query: string): string {
  const q = query.toLowerCase();
  const firstName = profile.first_name;

  if (goals.length === 0) {
    return `Hi ${firstName}! I see that you don't have any goals set up for the active cycle yet. To get started, click the "Add Goal" button in your dashboard to create your first goal! Once you set them up, I'll be here to coach you.`;
  }

  // Pre-calculate goal stats
  const goalsWithScores = goals.map(goal => {
    const latestCheckin = goal.quarterly_checkins && goal.quarterly_checkins.length > 0
      ? [...goal.quarterly_checkins].sort((a, b) => b.quarter.localeCompare(a.quarter))[0]
      : null;
    const progressScore = calculateProgressScore(goal.uom_type, goal.target, latestCheckin ? latestCheckin.achievement : null);
    return {
      title: goal.title,
      score: progressScore * 100,
      weightage: goal.weightage,
      status: latestCheckin?.status ?? 'not_started',
      target: goal.target,
      achievement: latestCheckin ? latestCheckin.achievement : 0
    };
  });

  const sortedByScore = [...goalsWithScores].sort((a, b) => a.score - b.score);
  const weakest = sortedByScore[0];
  const strongest = [...goalsWithScores].sort((a, b) => b.score - a.score)[0];
  const totalWeightage = goals.reduce((s, g) => s + g.weightage, 0);

  // 1. Question: Score Calculation
  if (q.includes('score') || q.includes('calculate') || q.includes('math') || q.includes('formula')) {
    return `Your overall score (${overallScore.toFixed(1)}%) is calculated as the sum of each goal's weighted achievement. For each goal, we measure the progress towards the target based on the UoM, scale it between 0% and 100%, and multiply by its weightage percentage. For instance, your strongest goal is '${strongest.title}' with ${strongest.weightage}% weightage, contributing substantially to your score!`;
  }

  // 2. Question: Weightage
  if (q.includes('weightage') || q.includes('balance') || q.includes('total weight')) {
    const statusMsg = totalWeightage === 100 
      ? `Your total weightage is perfectly balanced at 100%!` 
      : `Your total weightage is currently at ${totalWeightage}%, but remember that it must equal exactly 100% to submit your sheet!`;
      
    return `${statusMsg} Looking closely, your highest weight goal is '${strongest.title}' at ${strongest.weightage}% weightage, while your lowest is '${weakest.title}' at ${weakest.weightage}%. Ensure your highest-priority engineering KRAs hold a weight of 15% to 30% for ideal balance.`;
  }

  // 3. Question: Risk / Low Achievement
  if (q.includes('risk') || q.includes('low') || q.includes('worst') || q.includes('behind') || q.includes('improve')) {
    if (weakest.score < 50) {
      return `The goal most at risk right now is '${weakest.title}', which is currently showing a progress score of ${weakest.score.toFixed(0)}%. To improve this, I recommend scheduling a dedicated progress check-in or updating your current achievement values. Let me know if you need specific ideas to drive achievement on this topic!`;
    }
    return `Great news, ${firstName}! None of your goals are critically behind. Your lowest-performing goal is '${weakest.title}' at a healthy ${weakest.score.toFixed(0)}% achievement. To push your score even closer to 100%, let's focus on unlocking minor details for '${weakest.title}'!`;
  }

  // 4. Question: Encouragement / Advice
  if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('help') || q.includes('coach')) {
    return `Hello ${firstName}! I'm your AtomQuest Goal Coach. I can help you analyze your current score (${overallScore.toFixed(0)}%), review goal weightage balance, or suggest next steps for your '${weakest.title}' goal. What would you like to focus on today?`;
  }

  // 5. Question: Tips on engineering or innovation (Atomberg flavor!)
  if (q.includes('engineering') || q.includes('innovation') || q.includes('tips') || q.includes('cost') || q.includes('atomberg')) {
    return `At Atomberg Technologies, we excel when we pair engineering rigour with consumer-centric design. For goals like '${strongest.title}', consider asking yourself: 'Does this directly enhance product durability or reduce raw component overhead?' Let's seek opportunities to pilot new testing methods or automate processes for a competitive edge!`;
  }

  // 6. Generic coach response
  return `That's a very insightful point, ${firstName}! Regarding your active sheet, you have ${goals.length} goals with a current overall score of ${overallScore.toFixed(1)}%. I highly recommend focusing on '${weakest.title}' next, as raising its progress will give you the most efficient score increase. Let me know if you would like me to draft an improvement roadmap for it!`;
}
