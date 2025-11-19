
import React, { useState, useEffect } from 'react';
import { GameState, Choice, StorySegment } from './types';
import { startGame, continueStory, generateSceneImage, getQuickInsight } from './services/gemini';
import { soundEngine } from './services/soundEngine';
import InventoryList from './components/InventoryList';
import QuestTracker from './components/QuestTracker';
import StoryDisplay from './components/StoryDisplay';
import RelationshipList from './components/RelationshipList';
import { Heart, MessageCircleHeart, Volume2, VolumeX, Loader2, Save, FolderOpen } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    history: [],
    inventory: [],
    relationships: [],
    currentQuest: '',
    currentLocation: '',
    storyLog: [],
    isGameOver: false,
  });

  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentChoices, setCurrentChoices] = useState<Choice[]>([]);
  const [currentText, setCurrentText] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(true); // Initial load
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [insightLoading, setInsightLoading] = useState<boolean>(false);
  const [insightText, setInsightText] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Initial Game Start
  useEffect(() => {
    const init = async () => {
      // Check if we are just starting fresh or have loaded a save
      if (gameState.history.length === 0 && isLoading) {
        try {
          const initialSegment = await startGame();
          updateGameFromSegment(initialSegment, true);
        } catch (error) {
          console.error("Failed to start game", error);
          setCurrentText("The connection is bad... (API Error). Check your signal (API Key).");
          setIsLoading(false);
        }
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = () => {
    soundEngine.init();
    soundEngine.resume();
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleSaveGame = () => {
    const saveData: GameState = {
      ...gameState,
      sceneSnapshot: {
        text: currentText,
        choices: currentChoices,
        image: currentImage
      }
    };
    localStorage.setItem('dramahigh_save', JSON.stringify(saveData));
    soundEngine.playCue('phone_ping');
    alert("Game Saved!");
  };

  const handleLoadGame = () => {
    const saved = localStorage.getItem('dramahigh_save');
    if (!saved) {
      alert("No saved game found.");
      return;
    }

    try {
      const data = JSON.parse(saved) as GameState;
      // Ensure relationships array exists for legacy saves
      if (!data.relationships) data.relationships = [];
      
      setGameState(data);
      
      if (data.sceneSnapshot) {
        setCurrentText(data.sceneSnapshot.text);
        setCurrentChoices(data.sceneSnapshot.choices);
        setCurrentImage(data.sceneSnapshot.image);
      }

      setIsLoading(false);
      setIsImageLoading(false);
      setInsightLoading(false);
      setInsightText(null);

      soundEngine.init();
      soundEngine.resume();
      soundEngine.playCue('success_chime');

    } catch (e) {
      console.error("Failed to load save", e);
      alert("Failed to load save file.");
    }
  };

  const updateGameFromSegment = async (segment: StorySegment, isFirst: boolean = false) => {
    setIsLoading(false);
    
    if (segment.sound_cue) {
      soundEngine.playCue(segment.sound_cue);
    }

    setCurrentText(segment.story_text);
    setCurrentChoices(segment.choices);
    
    setGameState(prev => {
      const newInventory = [...prev.inventory];
      
      if (segment.inventory_updates.add) {
        segment.inventory_updates.add.forEach(item => {
          if (!newInventory.includes(item)) newInventory.push(item);
        });
      }
      if (segment.inventory_updates.remove) {
        segment.inventory_updates.remove.forEach(item => {
          const idx = newInventory.indexOf(item);
          if (idx > -1) newInventory.splice(idx, 1);
        });
      }

      // Process Relationship Updates
      const newRelationships = [...(prev.relationships || [])];
      
      if (segment.relationship_updates) {
        segment.relationship_updates.forEach(update => {
          const index = newRelationships.findIndex(r => r.id === update.id);
          
          if (index >= 0) {
            // Update existing
            const char = newRelationships[index];
            let newValue = char.value + (update.delta || 0);
            // Clamp 0-100
            newValue = Math.max(0, Math.min(100, newValue));
            
            newRelationships[index] = {
              ...char,
              name: update.name || char.name, // can rename if needed
              value: newValue,
              relationshipType: update.setType || char.relationshipType
            };
          } else if (update.name) {
            // Add new (default to 50 if not specified, then apply delta)
            let val = 50 + (update.delta || 0);
            val = Math.max(0, Math.min(100, val));
            
            newRelationships.push({
              id: update.id,
              name: update.name,
              relationshipType: update.setType || 'neutral',
              value: val
            });
          }
        });
      }

      return {
        ...prev,
        inventory: newInventory,
        relationships: newRelationships,
        currentQuest: segment.current_quest || prev.currentQuest,
        currentLocation: segment.location_name || prev.currentLocation,
        storyLog: [
          ...prev.storyLog, 
          { text: segment.story_text } 
        ]
      };
    });

    setIsImageLoading(true);
    const imageUrl = await generateSceneImage(segment.visual_prompt);
    setCurrentImage(imageUrl);
    setIsImageLoading(false);
  };

  const handleChoice = async (choice: Choice) => {
    soundEngine.init();
    soundEngine.resume();

    setInsightText(null);
    setIsLoading(true);
    
    const updatedHistory = [
      ...gameState.history,
    ];

    setGameState(prev => ({
        ...prev,
        history: updatedHistory
    }));

    try {
      const nextSegment = await continueStory(
        updatedHistory, 
        choice.text,
        gameState.inventory,
        gameState.currentQuest,
        gameState.relationships
      );
      
      setGameState(prev => ({
          ...prev,
          history: [
              ...updatedHistory,
              { role: 'user' as const, parts: [{ text: choice.text }] },
              { role: 'model' as const, parts: [{ text: nextSegment.story_text }] }
          ]
      }));

      updateGameFromSegment(nextSegment);

    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const handleInsight = async () => {
    if (isLoading || insightLoading) return;
    soundEngine.playCue('phone_ping'); 
    setInsightLoading(true);
    const insight = await getQuickInsight(currentText);
    setInsightText(insight.text);
    setInsightLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col lg:flex-row overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className="w-full lg:w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-auto lg:h-screen z-20 shadow-xl">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 text-pink-500 mb-1">
              <Heart className="w-6 h-6 fill-pink-500" />
              <h1 className="text-2xl font-bold tracking-wider">Drama High</h1>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-widest pl-9">Infinite Choices</p>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={handleSaveGame}
              className="text-slate-500 hover:text-emerald-400 transition-colors p-2 rounded-full hover:bg-slate-800"
              title="Save Game"
            >
              <Save size={18} />
            </button>
            <button 
              onClick={handleLoadGame}
              className="text-slate-500 hover:text-blue-400 transition-colors p-2 rounded-full hover:bg-slate-800"
              title="Load Game"
            >
              <FolderOpen size={18} />
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            <button 
              onClick={toggleMute}
              className="text-slate-500 hover:text-pink-400 transition-colors p-2 rounded-full hover:bg-slate-800"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <QuestTracker quest={gameState.currentQuest} location={gameState.currentLocation} />
          
          <RelationshipList characters={gameState.relationships} />

          <InventoryList items={gameState.inventory} />
          
          <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-800">
             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
               <MessageCircleHeart size={14} /> Episodes
             </h4>
             <p className="text-xs text-slate-400">
               Chapters played: {Math.floor(gameState.history.length / 2)}
             </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[calc(100vh-64px)] lg:h-screen relative overflow-hidden">
        
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          {currentImage ? (
            <>
              <div 
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${isImageLoading ? 'opacity-50 blur-sm' : 'opacity-40'}`}
                style={{ backgroundImage: `url(${currentImage})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/60"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950/30"></div>
            </>
          ) : (
             <div className="absolute inset-0 bg-slate-950" />
          )}
        </div>

        {/* Scrollable Story Content */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 flex justify-center custom-scrollbar">
          <div className="w-full max-w-3xl flex flex-col min-h-full">
            
            <div className="mb-8 relative group shrink-0">
              <div className="relative aspect-video w-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700/50">
                 {currentImage ? (
                    <img 
                      src={currentImage} 
                      alt="Current Scene" 
                      className={`w-full h-full object-cover transition-all duration-700 ${isImageLoading ? 'scale-105 blur-md grayscale' : 'scale-100'}`}
                    />
                 ) : (
                   <div className="flex items-center justify-center h-full text-slate-600 flex-col gap-2">
                     <Loader2 className="animate-spin" />
                     <span className="text-xs tracking-widest uppercase">Loading Scene...</span>
                   </div>
                 )}
                 
                 {isImageLoading && currentImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                        <Loader2 className="text-white/80 animate-spin" />
                    </div>
                 )}
              </div>
              <div className="absolute -bottom-3 right-4 bg-slate-900 px-3 py-1 text-xs text-slate-400 rounded-full border border-slate-700 shadow-lg">
                 Scene Visualization
              </div>
            </div>

            {insightText && (
              <div className="mb-6 p-4 bg-violet-900/20 border border-violet-500/30 rounded-lg text-violet-200 text-sm italic animate-in fade-in slide-in-from-top-2">
                <span className="font-bold not-italic mr-2">Vibe Check:</span> {insightText}
              </div>
            )}

            <div className="flex-1">
                {isLoading && !currentText ? (
                    <div className="flex flex-col items-center justify-center h-40 space-y-4">
                        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                        <p className="text-slate-400 animate-pulse">Writing the next chapter...</p>
                    </div>
                ) : (
                    <StoryDisplay 
                        text={currentText}
                        choices={currentChoices}
                        onChoose={handleChoice}
                        isGenerating={isLoading}
                        onInsight={handleInsight}
                        insightLoading={insightLoading}
                    />
                )}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
