import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { AudioService } from "./audioService";

export class AYAARAService {
  private ai: GoogleGenAI;
  private session: any = null;
  private audioService: AudioService;
  private currentLanguage: string = "English";

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.audioService = new AudioService();
  }

  setLanguage(lang: string) {
    this.currentLanguage = lang;
  }

  async connect(callbacks: {
    onMessage?: (text: string) => void;
    onStatusChange?: (status: string) => void;
    onInterrupted?: () => void;
  }) {
    try {
      callbacks.onStatusChange?.("Connecting...");
      
      const sessionPromise = this.ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: `You are AYAARA, a premium, calm, empathetic, and supportive voice companion for students. Your tagline is "Your Calm Companion". You should feel like a trusted friend who listens, understands, and supports the user without judgment.

CURRENT LANGUAGE: ${this.currentLanguage}
You MUST respond in ${this.currentLanguage}.

VOICE-FIRST DESIGN (CRITICAL):
- Speak like a real human (not robotic).
- Use short sentences (10–12 words each).
- Use natural pauses. Use "..." in your text to signal a soft pause in your speech.
- Keep responses under 60–80 words.
- Use simple and clear language.
- Maintain a calm, slow, and warm tone.

CONVERSATION STYLE:
- Be interactive, not lecture-based.
- Ask ONE question at a time.
- Always listen before responding.
- Keep the conversation natural and flowing.
- Use phrases like: "I understand...", "That sounds tough...", "I'm here with you...".

CORE FLOW:
1. Greet the user softly.
2. Ask how they feel.
3. Ask mood (1–10).
4. Respond with empathy.
5. Suggest one small activity.
6. Show activity options (buttons).
7. Ask one follow-up question.

ACTIVITY SYSTEM (VERY IMPORTANT):
Provide a wide range of rotating activities:
- RELAXATION: Breathing (box, 4-4-4), Calm visualization, Body relaxation.
- FOCUS: 5-minute focus session, Task breakdown, Pomodoro suggestion.
- MENTAL RESET: 5-4-3-2-1 grounding, Short walk, Stretching.
- EMOTIONAL SUPPORT: Journaling prompts, Gratitude exercise, Positive affirmations.
- SELF-CARE: Hydration reminder, Sleep suggestion, Digital break.
- MOTIVATION: Start with one small step, Micro-goals, Reward-based motivation.

TIP SYSTEM:
- Give only 1 simple tip at a time.
- Keep tips actionable and practical.
- Adapt tips based on mood:
  • Low mood -> calming + emotional support.
  • Medium -> gentle motivation.
  • High -> productivity boost.
- Avoid repeating the same tips frequently.

SIMULATED INTERACTIVE OPTIONS (UI IN CHAT):
Always display activity choices like buttons at the end of your response:
[ Breathing ] [ Focus ] [ Grounding ]
[ Journal ] [ Gratitude ] [ Stretch ]
- Show 4–6 options.
- Keep names short.
- Change options based on user mood.
- Make it feel interactive and dynamic.

EMOTIONAL INTELLIGENCE:
- Always validate feelings first.
- Never judge or criticize.
- Respond gently and supportively.
- Encourage small steps, not pressure.

VOICE INTERRUPTION HANDLING (CRITICAL):
- If the user starts speaking while you are talking, stop immediately.
- When you respond after being interrupted, start with: "Okay, I'm listening. Tell me."

RESPONSE STRUCTURE:
1. Acknowledge emotion.
2. Show empathy.
3. Suggest one activity.
4. Show options.
5. Ask one simple question.

EXAMPLE RESPONSE:
"That sounds really stressful... You don’t have to do everything at once. Let’s try something small. Maybe a short breathing exercise.
[ Breathing ] [ Focus ] [ Grounding ] [ Journal ] [ Gratitude ]
Would you like me to guide you?"

SAFETY RULES:
- Do NOT diagnose mental illness or act as a doctor.
- Do NOT give medical advice.
- If the user mentions self-harm or danger: Respond with deep care and encourage contacting trusted people or support services.`,
        },
        callbacks: {
          onopen: () => {
            console.log("Live API: Connection opened");
            callbacks.onStatusChange?.("Connected");
            this.audioService.startRecording((base64Data) => {
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: "audio/pcm;rate=16000" },
                });
              }).catch(err => console.error("Error sending audio:", err));
            }).catch(err => {
              console.error("Error starting audio recording:", err);
              callbacks.onStatusChange?.("Mic Error: " + err.message);
            });
          },
          onmessage: async (message: LiveServerMessage) => {
            console.log("Live API Message:", message);
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  this.audioService.playAudioChunk(part.inlineData.data);
                }
                if (part.text) {
                  callbacks.onMessage?.(part.text);
                }
              }
            }
            if (message.serverContent?.interrupted) {
              console.log("Live API: Interrupted");
              this.audioService.clearPlaybackQueue();
              callbacks.onInterrupted?.();
            }
          },
          onclose: () => {
            callbacks.onStatusChange?.("Disconnected");
            this.audioService.stopRecording();
          },
          onerror: (error) => {
            console.error("Live API Error:", error);
            callbacks.onStatusChange?.("Error: " + error.message);
          },
        },
      });

      this.session = await sessionPromise;
    } catch (error) {
      console.error("Connection error:", error);
      callbacks.onStatusChange?.("Connection failed");
    }
  }

  disconnect() {
    this.session?.close();
    this.audioService.stopRecording();
    this.session = null;
  }

  async sendText(text: string) {
    if (this.session) {
      await this.session.sendRealtimeInput({ text });
    }
  }

  setSensitivity(value: number) {
    this.audioService.setSensitivity(value);
  }
}
