import React, { useEffect, useRef } from 'react';
import { Choice } from '../types';
import { ChevronRight, Sparkles } from 'lucide-react';

interface StoryDisplayProps {
  text: string;
  choices: Choice[];
  onChoose: (choice: Choice) => void;
  isGenerating: boolean;
  onInsight: () => void;
  insightLoading: boolean;
}

const StoryDisplay: React.FC<StoryDisplayProps> = ({ 
  text, 
  choices, 
  onChoose, 
  isGenerating,
  onInsight,
  insightLoading
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when text changes
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [text, choices]);

  return (
    <div className="flex flex-col h-full">
      <div className="prose prose-invert max-w-none mb-8">
        <p className="story-text text-lg md:text-xl leading-relaxed text-slate-200 whitespace-pre-wrap">
          {text}
        </p>
      </div>

      <div className="mt-auto space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-slate-400 text-sm uppercase tracking-widest font-bold">What will you do?</h4>
          
          <button 
            onClick={onInsight}
            disabled={insightLoading || isGenerating}
            className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors px-3 py-1 rounded border border-purple-900 hover:bg-purple-900/30"
            title="Use Fast AI to sense the area"
          >
            <Sparkles size={14} />
            {insightLoading ? 'Sensing...' : 'Insight Check'}
          </button>
        </div>

        {isGenerating ? (
          <div className="space-y-3 animate-pulse">
             <div className="h-12 bg-slate-800 rounded-lg w-full"></div>
             <div className="h-12 bg-slate-800 rounded-lg w-3/4"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => onChoose(choice)}
                className="group flex items-center justify-between w-full text-left p-4 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 transition-all duration-200 active:scale-[0.99]"
              >
                <span className="font-medium text-slate-200 group-hover:text-amber-100">{choice.text}</span>
                <ChevronRight className="text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-1" size={20} />
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default StoryDisplay;