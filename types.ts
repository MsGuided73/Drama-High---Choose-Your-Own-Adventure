export interface Choice {
  id: string;
  text: string;
  action_summary?: string; // Short summary for history
}

export interface InventoryUpdate {
  add?: string[];
  remove?: string[];
}

export interface StorySegment {
  story_text: string;
  choices: Choice[];
  inventory_updates: InventoryUpdate;
  current_quest: string;
  visual_prompt: string;
  location_name: string;
  sound_cue: 'neutral' | 'school_ambience' | 'party_ambience' | 'phone_ping' | 'heartbeat' | 'drama_sting' | 'school_bell' | 'gossip_whisper' | 'success_chime';
}

export interface GameState {
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]; // Gemini Chat history format
  inventory: string[];
  currentQuest: string;
  currentLocation: string;
  storyLog: { text: string; image?: string; choiceMade?: string }[];
  isGameOver: boolean;
  // Snapshot of the current UI state for Save/Load restoration
  sceneSnapshot?: {
    text: string;
    choices: Choice[];
    image: string | null;
  };
}

export interface QuickInsight {
  text: string;
}