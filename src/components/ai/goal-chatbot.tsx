'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, MessageSquare, Trash2, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  "How is my overall score calculated?",
  "Is my weightage balanced?",
  "Which goal is most at risk?",
  "Tips to improve engineering goals"
];

export function GoalChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AtomQuest Goal Coach. I've analyzed your goal sheet and check-in achievements. How can I help you improve your score or structure your goals today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamedText, setStreamedText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedText, isOpen]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage = textToSend.trim();
    setInput('');
    setIsLoading(true);
    setStreamedText('');

    // Append user message immediately
    const updatedMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(updatedMessages);

    try {
      // API call with message history
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat stream');
      }

      if (!response.body) {
        throw new Error('No response body for stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        currentText += chunk;
        setStreamedText(currentText);
      }

      // Finish streaming, append to final message list
      setMessages(prev => [...prev, { role: 'assistant', content: currentText }]);
      setStreamedText('');
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again in a few moments." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Hi! I'm your AtomQuest Goal Coach. I've analyzed your goal sheet and check-in achievements. How can I help you improve your score or structure your goals today?"
      }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Panel */}
      {isOpen && (
        <Card className="mb-4 w-[350px] sm:w-[400px] h-[500px] shadow-2xl flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-slate-950 rounded-2xl animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* Header */}
          <CardHeader className="bg-zinc-900 text-white p-4 flex flex-row items-center justify-between space-y-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl relative">
                <Bot className="w-5 h-5" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-zinc-900 rounded-full animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-1.5 font-heading">
                  Goal Coach <Sparkles className="w-3.5 h-3.5 text-zinc-400 animate-pulse" />
                </CardTitle>
                <span className="text-[10px] text-zinc-400 font-medium font-sans">Active & Ready</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleClearChat}
                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
              >
                <X className="w-4.5 h-4.5" />
              </Button>
            </div>
          </CardHeader>
          
          {/* Chat Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm font-medium ${
                    msg.role === 'user'
                      ? 'bg-zinc-900 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/50 dark:border-slate-800/60'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {/* Streamed Assistant Content */}
            {streamedText && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-none px-4 py-2.5 text-sm leading-relaxed bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200/50 dark:border-slate-800/60 font-medium">
                  {streamedText}
                </div>
              </div>
            )}

            {/* Loading typing indicator */}
            {isLoading && !streamedText && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl rounded-bl-none px-4 py-3 border border-slate-200/50 dark:border-slate-800/60 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Suggestion Chips */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t bg-slate-50/50 dark:bg-slate-950/20 flex flex-wrap gap-1.5 shrink-0">
              {SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(sug)}
                  className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-full px-3 py-1 text-left transition-all duration-200 active:scale-95 shadow-sm"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Input Panel */}
          <div className="p-3 border-t bg-slate-50/50 dark:bg-slate-950/30 flex gap-2 items-center shrink-0">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Ask about score calculations, weightages..."
              disabled={isLoading}
              className="flex-1 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-zinc-900/30 focus-visible:ring-offset-0 focus-visible:border-zinc-900 h-10 shadow-inner"
            />
            <Button
              size="icon"
              onClick={() => handleSend(input)}
              disabled={isLoading || !input.trim()}
              className="h-10 w-10 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-md transition-all shrink-0 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Floating Sparkly Trigger Button */}
      <button
        id="chatbot-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform active:scale-95 group relative ${
          isOpen ? 'rotate-90 bg-slate-800 hover:bg-slate-900' : 'hover:scale-105'
        }`}
      >
        {/* Glow Ring ring animation */}
        <span className="absolute inset-0 rounded-full border border-zinc-400/30 dark:border-zinc-400/20 group-hover:animate-ping opacity-60" />
        
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
            <Sparkles className="w-3.5 h-3.5 text-zinc-400 absolute -top-1.5 -right-1.5 animate-pulse" />
          </div>
        )}
      </button>
    </div>
  );
}
