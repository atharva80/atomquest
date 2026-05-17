import { createClient } from '@/lib/supabase/server';
import { getActiveCycle } from '@/queries/cycles';
import { getOverallScore, calculateProgressScore } from '@/lib/utils';
import { GoalWithCheckins } from '@/types';
import { NextResponse } from 'next/server';

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

    // 2. Parse target employee ID if provided (for manager reviews)
    let employeeId = user.id;
    const body = await req.json().catch(() => ({}));
    if (body.employeeId && body.employeeId !== user.id) {
      // Permission check: check if the logged in user is the manager or an admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, manager_id')
        .eq('id', body.employeeId)
        .single();

      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || (profile.manager_id !== user.id && currentUserProfile?.role !== 'admin')) {
        return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      employeeId = body.employeeId;
    }

    // 3. Fetch active cycle
    const cycle = await getActiveCycle();
    if (!cycle) {
      return NextResponse.json({ error: 'No active cycle found' }, { status: 404 });
    }

    // 4. Fetch employee profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
    }

    // 5. Fetch goals with checkins
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select(`
        *,
        quarterly_checkins (*)
      `)
      .eq('profile_id', employeeId)
      .eq('cycle_id', cycle.id)
      .order('created_at', { ascending: true });

    if (goalsError) {
      console.error('Error fetching employee goals:', goalsError);
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }

    const typedGoals = (goals || []) as GoalWithCheckins[];
    const overallScore = getOverallScore(typedGoals) * 100; // Scaled to %

    if (typedGoals.length === 0) {
      return NextResponse.json({
        summary: `Hi ${profile.first_name}! You haven't created any goals yet. Start by defining your goals for this cycle so we can track and analyze your performance!`,
        simulated: true
      });
    }

    // Formulate a beautiful, tailored, data-driven simulated prompt or dynamic response
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey || geminiKey.trim() === '' || geminiKey.startsWith('re_') || geminiKey === 'your-gemini-key') {
      // Return highly smart simulated fallback summary
      const summary = generateMockSummary(profile, typedGoals, overallScore);
      return NextResponse.json({ summary, simulated: true });
    }

    // Otherwise, execute the actual Gemini 1.5 Flash fetch call!
    const prompt = `
      You are an elite corporate Performance Coach at Atomberg Technologies.
      Provide a professional, concise 2-sentence summary of the following employee's quarterly progress.
      Highlight the strongest goal, flag any goal at risk (low achievement or weightage imbalance), and offer one actionable next step.
      
      Employee: ${profile.first_name} ${profile.last_name}
      Role: ${profile.role}
      Active Cycle Goals:
      ${JSON.stringify(typedGoals.map(g => ({
        title: g.title,
        weightage: g.weightage,
        uom: g.uom_type,
        target: g.target,
        latest_achievement: g.quarterly_checkins?.sort((a: any, b: any) => b.quarter.localeCompare(a.quarter))[0]?.achievement ?? null,
        status: g.status
      })), null, 2)}
      
      Overall Weighted Progress Score: ${overallScore.toFixed(1)}%
      
      Response guidelines:
      - Keep it strictly under 3 sentences.
      - Focus on data-driven observations.
      - Write in a highly constructive, encouraging, and corporate tone.
      - Speak directly to the employee ("You are on track...") if this is employee themselves, otherwise in third person for managers.
      - Do not include markdown headers or greetings, just the summary text.
    `;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: {
              parts: [{ text: "You are 'AtomQuest AI Coach', a warm, friendly, and expert performance advisor at Atomberg Technologies." }]
            },
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 2000,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API responded with status ${response.status}`);
      }

      const resData = await response.json();
      const text = resData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Gemini API returned an empty response');
      }

      return NextResponse.json({ summary: text.trim(), simulated: false });
    } catch (apiError) {
      console.error('Gemini API call failed, falling back to simulated summary:', apiError);
      const summary = generateMockSummary(profile, typedGoals, overallScore);
      return NextResponse.json({ summary, simulated: true, error: 'Gemini API unavailable' });
    }
  } catch (error) {
    console.error('Error in summary route handler:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Highly sophisticated, professional performance coach dynamic generator
function generateMockSummary(profile: any, goals: GoalWithCheckins[], overallScore: number): string {
  const isEmployee = true; // For our context, usually addressed to the profile itself
  const firstName = profile.first_name;

  // Analyze goals
  const goalsWithScores = goals.map(goal => {
    const latestCheckin = goal.quarterly_checkins && goal.quarterly_checkins.length > 0
      ? [...goal.quarterly_checkins].sort((a, b) => b.quarter.localeCompare(a.quarter))[0]
      : null;
    const progressScore = calculateProgressScore(goal.uom_type, goal.target, latestCheckin ? latestCheckin.achievement : null);
    return {
      title: goal.title,
      score: progressScore * 100,
      weightage: goal.weightage,
      status: latestCheckin?.status ?? 'not_started'
    };
  });

  // Sort by score
  const sorted = [...goalsWithScores].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = [...goalsWithScores].sort((a, b) => a.score - b.score)[0];

  const totalWeightage = goals.reduce((s, g) => s + g.weightage, 0);

  let sentence1 = '';
  let sentence2 = '';
  let sentence3 = '';

  if (overallScore >= 80) {
    sentence1 = `Outstanding progress, ${firstName}! You are currently delivering exemplary results, pacing at a weighted completion score of ${overallScore.toFixed(0)}% across your active goal sheet.`;
    sentence2 = `Your performance is exceptionally strong in '${strongest.title}' (at ${strongest.score.toFixed(0)}% achievement).`;
    sentence3 = `To further optimize, ensure all documentation and secondary metrics are finalized to secure your stellar quarterly performance.`;
  } else if (overallScore >= 40) {
    sentence1 = `Solid progress, ${firstName}! Your overall weighted score stands at ${overallScore.toFixed(0)}%, reflecting balanced efforts across most of your corporate objectives.`;
    sentence2 = strongest.score > weakest.score 
      ? `While '${strongest.title}' is highly successful (at ${strongest.score.toFixed(0)}%), your '${weakest.title}' goal presents a valuable opportunity for accelerated focus.`
      : `All active goals are tracking moderately; keep pushing the needle forward.`;
    sentence3 = `We recommend conducting a targeted session on your '${weakest.title}' key result area to bridge any achievement gaps before the cycle review.`;
  } else {
    sentence1 = `Hi ${firstName}, you are in the foundational phase of your cycle goals, with a current overall score of ${overallScore.toFixed(0)}% and a total registered weightage of ${totalWeightage}%.`;
    sentence2 = weakest.score === 0
      ? `Several of your primary KRA goals, including '${weakest.title}', are currently in 'Not Started' or early development status.`
      : `Your goal '${weakest.title}' requires immediate attention to match the initial target trajectories.`;
    sentence3 = `Ensure you submit check-ins for your active goals soon, and sync with your manager to align resources for '${weakest.title}'.`;
  }

  return `${sentence1} ${sentence2} ${sentence3}`;
}
