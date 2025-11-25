
import React from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { CharacterSkin } from '../../types';

export const generateSkin = async (
    promptText: string, 
    apiKey: string | undefined,
    setAvailableSkins: React.Dispatch<React.SetStateAction<CharacterSkin[]>>,
    setGameState: any,
    setShowAiInput: (v: boolean) => void
) => {
      // Get API key from parameter, localStorage, or env
      const key = apiKey || localStorage.getItem('GEMINI_API_KEY') || process.env.API_KEY;
      
      if (!key) {
          throw new Error('No API Key configured. Go to Settings > API Key to add your Gemini API Key.');
      }
      
      const ai = new GoogleGenAI({ apiKey: key });
      
      const schema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "Short name (e.g. 'NINJA')" },
            color: { type: Type.STRING, description: "Main hex color" },
            pixels: { 
                type: Type.ARRAY, 
                description: "16x16 integer grid",
                items: { 
                    type: Type.ARRAY, 
                    items: { type: Type.INTEGER } 
                } 
            }
        }
      };

      const prompt = `
        Generate a 16x16 pixel art character based on: "${promptText}".
        STYLE: Chibi, cute, big head, big eyes.
        GRID: 16x16 integers.
        INDICES:
        0 = Transparent
        1 = Dark Outline
        2 = Main Color
        3 = Highlight
        4 = Eye White (Sclera) - MUST BE VISIBLE
        5 = Eye Pupil (Black) - MUST BE VISIBLE
        6 = Extra Detail
        RULES:
        - Eyes (4 and 5) must be distinct and clearly visible.
        - Arms should be slightly separated from body if possible.
        - Clean pixel art, no noise.
      `;

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema: schema
          }
      });

      const json = JSON.parse(response.text);
      if (json.pixels && json.pixels.length > 0) {
          const newSkin: CharacterSkin = {
              id: `ai-${Date.now()}`,
              name: json.name.toUpperCase().substring(0, 10),
              color: json.color,
              pixels: json.pixels
          };
          setAvailableSkins(prev => [...prev, newSkin]);
          setGameState((prev: any) => ({ ...prev, selectedSkin: newSkin }));
          setShowAiInput(false);
      }
};
