import { GoogleGenAI, Type, SchemaType } from "@google/genai";
import { GameState, StorySegment, QuickInsight } from '../types';

// Initialize Gemini Client
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Model Configurations ---
const STORY_MODEL = 'gemini-3-pro-preview';
const IMAGE_MODEL = 'imagen-4.0-generate-001';
const FAST_MODEL = 'gemini-2.5-flash-lite-latest';


const SYSTEM_INSTRUCTION = `
You are the Narrator for "Drama High", an infinite interactive novel for a teenage audience (targeted at ~13-year-old girls).
The setting is a modern high school. The tone is emotional, dramatic, and relatable, similar to "Sweet Valley High" or a teen drama TV show.

Your goal is to create a story driven by social dynamics, peer pressure, and consequences.
You must track the user's "Backpack Items" (Inventory) and "Current Goal" (Quest).

RULES:
1.  **Format**: ALWAYS return a valid JSON object matching the schema.
2.  **Consequences**: Choices must have real effects. 
    *   *Example*: Staying up late texting a boy -> Sleeping in class -> Failing a test.
    *   *Example*: Sharing a secret -> Losing a friend -> Sitting alone at lunch.
3.  **Inventory**: Track items like 'Smartphone', 'Lip Gloss', 'Notes', 'Textbook', or abstract things like 'Invitation to Party'.
4.  **Current Goal**: Update 'current_quest' to be the immediate social or academic objective (e.g., "Pass the Math Test", "Find out who started the rumor").
5.  **Visuals**: Provide a 'visual_prompt' for an AI image generator.
    *   Style: Modern Digital Art, Webtoon Style, Soft Lighting, Expressive Characters, High School Aesthetic.
6.  **Sound Cues**: Select a 'sound_cue' that matches the vibe.
    *   'neutral': Normal conversation.
    *   'school_ambience': Hallways, cafeteria, classrooms.
    *   'party_ambience': Music, crowded places.
    *   'phone_ping': Receiving a text, notification, social media update.
    *   'heartbeat': Crushes, anxiety, getting caught doing something.
    *   'drama_sting': Shocking revelation, bad news, confrontation.
    *   'school_bell': Class starting/ending.
    *   'gossip_whisper': Hearing rumors, secrets revealed.
    *   'success_chime': Acing a test, getting asked out.
7.  **Tone**: Use modern teen slang appropriately but keep it readable. Focus on feelings, social status, and academic stress.

Your output will be parsed programmatically.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    story_text: { type: Type.STRING },
    choices: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          text: { type: Type.STRING },
          action_summary: { type: Type.STRING }
        },
        required: ['id', 'text']
      }
    },
    inventory_updates: {
      type: Type.OBJECT,
      properties: {
        add: { type: Type.ARRAY, items: { type: Type.STRING } },
        remove: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    current_quest: { type: Type.STRING },
    visual_prompt: { type: Type.STRING },
    location_name: { type: Type.STRING },
    sound_cue: { 
      type: Type.STRING, 
      enum: [
        'neutral', 
        'school_ambience', 
        'party_ambience', 
        'phone_ping', 
        'heartbeat', 
        'drama_sting', 
        'school_bell', 
        'gossip_whisper',
        'success_chime'
      ] 
    }
  },
  required: ['story_text', 'choices', 'visual_prompt', 'location_name', 'sound_cue']
};

export const startGame = async (): Promise<StorySegment> => {
  const ai = getAiClient();
  
  const prompt = "Start the story. I am a 13-year-old girl named Maya. It's Monday morning, the alarm is ringing, and I have a big history test today that I barely studied for because I was texting my crush last night. What happens?";
  
  try {
    const response = await ai.models.generateContent({
      model: STORY_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as StorySegment;

  } catch (error) {
    console.error("Start Game Error:", error);
    throw error;
  }
};

export const continueStory = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  choiceText: string,
  currentInventory: string[],
  currentQuest: string
): Promise<StorySegment> => {
  const ai = getAiClient();

  const stateContext = `
    [Backpack/Status: ${currentInventory.join(', ') || 'None'}]
    [Current Goal: ${currentQuest || 'Unknown'}]
    
    I chose: "${choiceText}".
    Continue the story. Remember consequences!
  `;
  
  const chatSession = ai.chats.create({
    model: STORY_MODEL,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA
    },
    history: history
  });

  try {
    const response = await chatSession.sendMessage({ message: stateContext });
    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as StorySegment;
  } catch (error) {
    console.error("Continue Story Error:", error);
    throw error;
  }
};

export const generateSceneImage = async (visualPrompt: string): Promise<string | null> => {
  const ai = getAiClient();
  
  // Modern Teen Drama / Webtoon aesthetic
  const finalPrompt = `Digital art, visual novel background, webtoon style, soft lighting, modern high school setting, highly detailed, anime-influenced but realistic. ${visualPrompt}`;

  try {
    const response = await ai.models.generateImages({
      model: IMAGE_MODEL,
      prompt: finalPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '16:9',
        outputMimeType: 'image/jpeg'
      }
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (imageBytes) {
      return `data:image/jpeg;base64,${imageBytes}`;
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
};

export const getQuickInsight = async (context: string): Promise<QuickInsight> => {
  const ai = getAiClient();
  
  const prompt = `
    Context: ${context}
    Task: Provide a "Vibe Check". What is the social atmosphere? Is someone lying? Is the main character forgetting something?
    Output plain text, max 1 sentence.
  `;

  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: prompt,
    });
    return { text: response.text || "You can't quite read the room." };
  } catch (error) {
    return { text: "Too distracted to notice." };
  }
};