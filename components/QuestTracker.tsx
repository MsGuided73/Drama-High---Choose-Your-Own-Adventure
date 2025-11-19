import React from 'react';
import { CalendarHeart, MapPin } from 'lucide-react';

interface QuestTrackerProps {
  quest: string;
  location: string;
}

const QuestTracker: React.FC<QuestTrackerProps> = ({ quest, location }) => {
  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center gap-2 mb-2 text-violet-400">
          <CalendarHeart size={20} />
          <h3 className="font-bold uppercase tracking-wider text-sm">Current Goal</h3>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed font-medium">
          {quest || "Survive the school day..."}
        </p>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center gap-2 mb-2 text-blue-400">
          <MapPin size={20} />
          <h3 className="font-bold uppercase tracking-wider text-sm">Location</h3>
        </div>
        <p className="text-slate-300 text-sm font-medium">
          {location || "Unknown"}
        </p>
      </div>
    </div>
  );
};

export default QuestTracker;