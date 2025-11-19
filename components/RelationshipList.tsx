
import React from 'react';
import { Users, Heart, Skull, Zap, UserCheck, UserMinus } from 'lucide-react';
import { Character } from '../types';

interface RelationshipListProps {
  characters: Character[];
}

const RelationshipList: React.FC<RelationshipListProps> = ({ characters }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'crush': return <Heart size={14} className="fill-pink-500 text-pink-500" />;
      case 'rival': return <Zap size={14} className="fill-amber-500 text-amber-500" />;
      case 'enemy': return <Skull size={14} className="text-purple-500" />;
      case 'friend': return <UserCheck size={14} className="text-emerald-500" />;
      default: return <UserMinus size={14} className="text-slate-400" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'crush': return 'bg-pink-500';
      case 'rival': return 'bg-amber-500';
      case 'enemy': return 'bg-purple-500';
      case 'friend': return 'bg-emerald-500';
      default: return 'bg-slate-500';
    }
  };

  const getLabel = (type: string) => {
      return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center gap-2 mb-3 text-indigo-400">
        <Users size={20} />
        <h3 className="font-bold uppercase tracking-wider text-sm">Social Circle</h3>
      </div>

      {characters.length === 0 ? (
        <div className="text-slate-500 text-sm italic text-center py-2">
            You haven't met anyone noteworthy yet.
        </div>
      ) : (
        <div className="space-y-4">
          {characters.map((char) => (
            <div key={char.id} className="bg-slate-900/50 p-3 rounded border border-slate-800">
              <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="font-bold text-slate-200 text-sm">{char.name}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        {getIcon(char.relationshipType)}
                        <span>{getLabel(char.relationshipType)}</span>
                    </div>
                </div>
                <div className="text-xs font-mono text-slate-500">
                    {char.value}%
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ${getColor(char.relationshipType)}`}
                    style={{ width: `${char.value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RelationshipList;
