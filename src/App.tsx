import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mic, MicOff, Volume2, VolumeX, Heart, Sparkles, Coffee, Wind, Info, AlertCircle,
  Eye, Zap, MapPin, Footprints, Dumbbell, PenTool, Star, Droplets, Moon, LayoutGrid,
  Timer, Brain
} from "lucide-react";
import { AYAARAService } from "./services/airaService";
import { cn } from "./lib/utils";

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState("Ready to talk");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [mood, setMood] = useState<number | null>(null);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [sensitivity, setSensitivity] = useState(1.0);
  const [showBreathing, setShowBreathing] = useState(false);
  const [language, setLanguage] = useState("English");
  const [messages, setMessages] = useState<{ role: 'user' | 'aira', text: string }[]>([]);
  
  const airaServiceRef = useRef<AYAARAService | null>(null);
  const currentAiraMessageRef = useRef("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      airaServiceRef.current = new AYAARAService(apiKey);
    } else {
      setStatus("API Key missing in environment");
    }
  }, []);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    airaServiceRef.current?.setLanguage(lang);
  };

  const toggleConnection = async () => {
    if (isConnected) {
      airaServiceRef.current?.disconnect();
      setIsConnected(false);
      setStatus("Ready to talk");
    } else {
      if (!airaServiceRef.current) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
          airaServiceRef.current = new AYAARAService(apiKey);
        } else {
          setStatus("API Key missing");
          return;
        }
      }
      
      try {
        airaServiceRef.current.setLanguage(language);
        currentAiraMessageRef.current = "";
        await airaServiceRef.current.connect({
          onMessage: (text) => {
            setIsListening(false);
            currentAiraMessageRef.current += text;
            setTranscript(currentAiraMessageRef.current);
            // Update the last message if it's from AIRA, otherwise add a new one
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last && last.role === 'aira') {
                return [...prev.slice(0, -1), { role: 'aira', text: currentAiraMessageRef.current }];
              }
              return [...prev, { role: 'aira', text: currentAiraMessageRef.current }];
            });
          },
          onStatusChange: (newStatus) => {
            setStatus(newStatus);
            if (newStatus === "Listening") setIsListening(true);
          },
          onInterrupted: () => {
            setIsListening(true);
            currentAiraMessageRef.current = "";
            setTranscript("");
            setStatus("Listening...");
          },
        });
        setIsConnected(true);
      } catch (err) {
        console.error("Failed to connect:", err);
        setStatus("Connection failed");
      }
    }
  };

  const handleActionClick = async (action: string) => {
    if (airaServiceRef.current && isConnected) {
      setMessages(prev => [...prev, { role: 'user', text: action }]);
      currentAiraMessageRef.current = "";
      await airaServiceRef.current.sendText(action);
    }
  };

  const parseButtons = (text: string) => {
    const buttonRegex = /\[\s*([^\]]+)\s*\]/g;
    const buttons = [...text.matchAll(buttonRegex)].map(match => match[1].trim());
    const cleanText = text.replace(buttonRegex, '').replace(/\n\s*\n/g, '\n').trim();
    return { cleanText, buttons };
  };

  const handleMoodSelect = (value: number) => {
    setMood(value);
    setShowMoodPicker(false);
  };

  const handleSensitivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSensitivity(value);
    airaServiceRef.current?.setSensitivity(value);
  };

  const startBreathing = () => {
    setShowBreathing(true);
    setTimeout(() => setShowBreathing(false), 30000); // 30 seconds exercise
  };

  return (
    <div className="min-h-screen bg-[#0a0502] text-[#e0d8d0] font-sans selection:bg-[#ff4e00]/30 overflow-hidden flex flex-col items-center justify-center p-6 relative">
      <AnimatePresence>
        {showBreathing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0a0502]/95 backdrop-blur-3xl flex flex-col items-center justify-center gap-12"
          >
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="w-48 h-48 rounded-full border-2 border-[#ff4e00] flex items-center justify-center"
            >
              <motion.div
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                className="text-[#ff4e00] text-xl font-serif italic"
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={Math.floor(Date.now() / 4000) % 2}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {Math.floor(Date.now() / 4000) % 2 === 0 ? "Breathe In" : "Breathe Out"}
                  </motion.span>
                </AnimatePresence>
              </motion.div>
            </motion.div>
            <button 
              onClick={() => setShowBreathing(false)}
              className="text-xs uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
            >
              End Session
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Atmospheric Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#3a1510] rounded-full blur-[120px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff4e00] rounded-full blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-12">
        {/* Header */}
        <header className="text-center space-y-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-[#ff4e00]"
          >
            <Sparkles size={20} />
            <span className="text-xs font-medium uppercase tracking-[0.2em]">AYAARA - Your Calm Companion</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-8xl font-serif font-light tracking-tighter"
          >
            AYAARA
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            className="text-sm font-light italic"
          >
            Your multilingual companion for mental wellness
          </motion.p>
        </header>

        {/* Language Selector */}
        <div className="flex flex-wrap justify-center gap-2">
          {["English", "Tamil", "Malayalam", "Telugu", "Hindi"].map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest transition-all border",
                language === lang 
                  ? "bg-[#ff4e00] border-[#ff4e00] text-white" 
                  : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
              )}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Interaction Area */}
        <div className="w-full flex flex-col items-center gap-8">
          {/* Visualizer / Pulse */}
          <div className="relative flex items-center justify-center w-64 h-64">
            <AnimatePresence>
              {isConnected && (
                <>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="absolute inset-0 bg-[#ff4e00] rounded-full blur-3xl"
                  />
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
                    className="absolute inset-4 border border-[#ff4e00]/30 rounded-full"
                  />
                </>
              )}
            </AnimatePresence>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleConnection}
              className={cn(
                "relative z-20 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500",
                isConnected 
                  ? (isListening ? "bg-[#ff4e00] text-white shadow-[0_0_60px_rgba(255,78,0,0.6)]" : "bg-[#ff4e00]/80 text-white shadow-[0_0_40px_rgba(255,78,0,0.3)]")
                  : "bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60"
              )}
            >
              {isConnected ? (
                isListening ? <Mic size={40} className="animate-pulse" /> : <Volume2 size={40} />
              ) : (
                <MicOff size={40} />
              )}
            </motion.button>
          </div>

          {/* Status & Transcript */}
          <div className="text-center space-y-4 w-full px-4">
            <div className="flex items-center justify-center gap-2 text-xs font-mono tracking-widest uppercase opacity-40">
              <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-green-500 animate-pulse" : "bg-white/20")} />
              {status}
            </div>
            
            <div className="max-h-[300px] overflow-y-auto w-full space-y-6 px-2 scrollbar-hide flex flex-col items-center">
              <AnimatePresence mode="popLayout">
                {messages.length === 0 && !isConnected && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    className="text-sm italic"
                  >
                    Tap the microphone to start your session
                  </motion.p>
                )}
                {messages.map((msg, idx) => {
                  const { cleanText, buttons } = parseButtons(msg.text);
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "w-full flex flex-col gap-3",
                        msg.role === 'user' ? "items-end" : "items-center"
                      )}
                    >
                      <div className={cn(
                        "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
                        msg.role === 'user' 
                          ? "bg-[#ff4e00]/10 border border-[#ff4e00]/20 text-[#ff4e00]" 
                          : "bg-white/5 border border-white/10 text-white/80 italic font-serif"
                      )}>
                        {cleanText}
                      </div>
                      
                      {buttons.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                          {buttons.map((btn, bIdx) => (
                            <motion.button
                              key={bIdx}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleActionClick(btn)}
                              className="px-4 py-2 rounded-xl bg-[#ff4e00]/10 border border-[#ff4e00]/20 text-[#ff4e00] text-[10px] uppercase tracking-widest hover:bg-[#ff4e00] hover:text-white transition-all"
                            >
                              {btn}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Quick Actions / Mood */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wider opacity-60 flex items-center gap-2">
                <Heart size={14} className="text-[#ff4e00]" />
                How are you feeling?
              </h3>
              {mood && <span className="text-[#ff4e00] font-serif italic">{mood}/10</span>}
            </div>
            
            <div className="flex justify-between gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                <button
                  key={val}
                  onClick={() => handleMoodSelect(val)}
                  className={cn(
                    "flex-1 h-8 rounded-lg text-[10px] font-mono transition-all",
                    mood === val 
                      ? "bg-[#ff4e00] text-white" 
                      : "bg-white/5 hover:bg-white/10 text-white/40"
                  )}
                >
                  {val}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col gap-4"
          >
            <h3 className="text-xs font-medium uppercase tracking-wider opacity-60 flex items-center gap-2">
              <LayoutGrid size={14} className="text-[#ff4e00]" />
              Activities & Relief
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button 
                onClick={startBreathing}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-[#ff4e00]/20 border border-white/5 text-[9px] uppercase tracking-tighter flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <Wind size={14} className="group-hover:text-[#ff4e00]" />
                Breathing
              </button>
              <button 
                onClick={() => handleActionClick("Guided Visualization")}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-[#ff4e00]/20 border border-white/5 text-[9px] uppercase tracking-tighter flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <Eye size={14} className="group-hover:text-[#ff4e00]" />
                Visualize
              </button>
              <button 
                onClick={() => handleActionClick("5-4-3-2-1 Grounding")}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-[#ff4e00]/20 border border-white/5 text-[9px] uppercase tracking-tighter flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <MapPin size={14} className="group-hover:text-[#ff4e00]" />
                Grounding
              </button>
              <button 
                onClick={() => handleActionClick("Focus Session")}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-[#ff4e00]/20 border border-white/5 text-[9px] uppercase tracking-tighter flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <Timer size={14} className="group-hover:text-[#ff4e00]" />
                Focus
              </button>
              <button 
                onClick={() => handleActionClick("Journaling Prompt")}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-[#ff4e00]/20 border border-white/5 text-[9px] uppercase tracking-tighter flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <PenTool size={14} className="group-hover:text-[#ff4e00]" />
                Journal
              </button>
              <button 
                onClick={() => handleActionClick("Positive Affirmations")}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-[#ff4e00]/20 border border-white/5 text-[9px] uppercase tracking-tighter flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <Star size={14} className="group-hover:text-[#ff4e00]" />
                Affirm
              </button>
              <button 
                onClick={() => handleActionClick("Stretching Exercise")}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-[#ff4e00]/20 border border-white/5 text-[9px] uppercase tracking-tighter flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <Dumbbell size={14} className="group-hover:text-[#ff4e00]" />
                Stretch
              </button>
              <button 
                onClick={() => handleActionClick("Hydration Reminder")}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-[#ff4e00]/20 border border-white/5 text-[9px] uppercase tracking-tighter flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <Droplets size={14} className="group-hover:text-[#ff4e00]" />
                Hydrate
              </button>
              <button 
                onClick={() => handleActionClick("Sleep Hygiene Tips")}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-[#ff4e00]/20 border border-white/5 text-[9px] uppercase tracking-tighter flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <Moon size={14} className="group-hover:text-[#ff4e00]" />
                Sleep
              </button>
              <button 
                onClick={() => handleActionClick("Body Relaxation Scan")}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-[#ff4e00]/20 border border-white/5 text-[9px] uppercase tracking-tighter flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <Brain size={14} className="group-hover:text-[#ff4e00]" />
                Body Scan
              </button>
              <button 
                onClick={() => handleActionClick("Short Walk")}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-[#ff4e00]/20 border border-white/5 text-[9px] uppercase tracking-tighter flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <Footprints size={14} className="group-hover:text-[#ff4e00]" />
                Walk
              </button>
              <button 
                onClick={() => handleActionClick("Cold Water Splash")}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-[#ff4e00]/20 border border-white/5 text-[9px] uppercase tracking-tighter flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <Zap size={14} className="group-hover:text-[#ff4e00]" />
                Cold Water
              </button>
              <button 
                onClick={() => handleActionClick("Gratitude Exercise")}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-[#ff4e00]/20 border border-white/5 text-[9px] uppercase tracking-tighter flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <Heart size={14} className="group-hover:text-[#ff4e00]" />
                Gratitude
              </button>
              <button 
                onClick={() => handleActionClick("Start Small Method")}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-[#ff4e00]/20 border border-white/5 text-[9px] uppercase tracking-tighter flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <Zap size={14} className="group-hover:text-[#ff4e00]" />
                Start Small
              </button>
              <button 
                onClick={() => handleActionClick("Pomodoro Timer")}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-[#ff4e00]/20 border border-white/5 text-[9px] uppercase tracking-tighter flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <Timer size={14} className="group-hover:text-[#ff4e00]" />
                Pomodoro
              </button>
              <button 
                onClick={() => handleActionClick("Task Breakdown")}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-[#ff4e00]/20 border border-white/5 text-[9px] uppercase tracking-tighter flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <LayoutGrid size={14} className="group-hover:text-[#ff4e00]" />
                Breakdown
              </button>
              <button 
                onClick={() => handleActionClick("Micro-goal Setting")}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-[#ff4e00]/20 border border-white/5 text-[9px] uppercase tracking-tighter flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <Sparkles size={14} className="group-hover:text-[#ff4e00]" />
                Micro-goal
              </button>
              <button 
                onClick={() => handleActionClick("5-minute Break")}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-[#ff4e00]/20 border border-white/5 text-[9px] uppercase tracking-tighter flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <Coffee size={14} className="group-hover:text-[#ff4e00]" />
                Break
              </button>
            </div>
          </motion.div>
        </div>

        {/* Sensitivity Control */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-wider opacity-60 flex items-center gap-2">
              <Mic size={14} className="text-[#ff4e00]" />
              Mic Sensitivity
            </h3>
            <span className="text-[#ff4e00] font-mono text-[10px]">{Math.round(sensitivity * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="3" 
            step="0.1" 
            value={sensitivity} 
            onChange={handleSensitivityChange}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ff4e00]"
          />
          <div className="flex justify-between text-[8px] uppercase tracking-widest opacity-30">
            <span>Low</span>
            <span>Normal</span>
            <span>High</span>
          </div>
        </motion.div>

        {/* Safety Footer */}
        <footer className="w-full pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 opacity-30 text-[10px] uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <AlertCircle size={12} />
            Supportive Companion • Not Medical Advice
          </div>
          <div className="flex items-center gap-4">
            <button className="hover:opacity-100 transition-opacity">Help Resources</button>
            <button className="hover:opacity-100 transition-opacity">Privacy</button>
          </div>
        </footer>
      </main>

      {/* Background Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
