import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mic, MicOff, Volume2, Heart, Sparkles, Coffee, Wind, Info, AlertCircle,
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
  const [mood, setMood] = useState<number | null>(null);
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

  const wellnessActivities = [
    { icon: Wind, label: "Breathing", action: startBreathing },
    { icon: Eye, label: "Visualize", action: "Guided Visualization" },
    { icon: MapPin, label: "Grounding", action: "5-4-3-2-1 Grounding" },
    { icon: Timer, label: "Focus", action: "Focus Session" },
    { icon: PenTool, label: "Journal", action: "Journaling Prompt" },
    { icon: Star, label: "Affirm", action: "Positive Affirmations" },
    { icon: Dumbbell, label: "Stretch", action: "Stretching Exercise" },
    { icon: Droplets, label: "Hydrate", action: "Hydration Reminder" },
    { icon: Moon, label: "Sleep", action: "Sleep Hygiene Tips" },
    { icon: Brain, label: "Body Scan", action: "Body Relaxation Scan" },
    { icon: Footprints, label: "Walk", action: "Short Walk" },
    { icon: Heart, label: "Gratitude", action: "Gratitude Exercise" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F8FAFC] font-sans selection:bg-[#0891B2]/30 overflow-hidden flex flex-col items-center justify-center p-4 md:p-8 relative transition-colors duration-700">
      <AnimatePresence>
        {showBreathing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#F5F5F0]/95 dark:bg-[#0F172A]/95 backdrop-blur-md flex flex-col items-center justify-center gap-12"
          >
            <motion.div
              animate={{ scale: [1, 1.8, 1] }}
              transition={{ repeat: Infinity, duration: 8, ease: [0.32, 0.72, 0, 1] }}
              className="w-48 h-48 rounded-full bg-[#0891B2]/20 dark:bg-[#2DD4BF]/20 blur-xl absolute"
            />
            <motion.div
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 8, ease: [0.32, 0.72, 0, 1] }}
              className="w-32 h-32 rounded-full border border-[#0891B2] dark:border-[#2DD4BF] flex items-center justify-center relative z-10 bg-white/50 dark:bg-black/20 backdrop-blur-sm"
            >
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                className="text-[#0891B2] dark:text-[#2DD4BF] text-lg font-serif italic"
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
              className="text-sm uppercase tracking-widest text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] transition-colors relative z-10"
            >
              End Session
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Atmospheric Biophilic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: [-20, 20, -20], y: [-20, 20, -20] }}
          transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0891B2] dark:bg-[#2DD4BF] rounded-full blur-[140px] opacity-[0.15] dark:opacity-[0.1]" 
        />
        <motion.div 
          animate={{ x: [20, -20, 20], y: [20, -20, 20] }}
          transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#10B981] dark:bg-[#047857] rounded-full blur-[160px] opacity-[0.1] dark:opacity-[0.15]" 
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-3xl flex flex-col items-center gap-12 pb-12">
        {/* Header */}
        <header className="text-center space-y-3 mt-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-[#0891B2] dark:text-[#2DD4BF]"
          >
            <Sparkles size={18} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">Your Calm Companion</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-serif text-[#0F172A] dark:text-[#F8FAFC]"
          >
            AYAARA
          </motion.h1>
        </header>

        {/* Language Selector */}
        <div className="flex flex-wrap justify-center gap-3">
          {["English", "Tamil", "Malayalam", "Telugu", "Hindi"].map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={cn(
                "px-5 py-2 rounded-full text-[11px] uppercase font-semibold tracking-wider transition-all duration-300",
                language === lang 
                  ? "bg-[#0891B2] dark:bg-[#2DD4BF] text-white dark:text-[#0F172A] shadow-md shadow-[#0891B2]/20" 
                  : "bg-white/60 dark:bg-[#1E293B]/60 text-[#6B7280] dark:text-[#94A3B8] hover:bg-white dark:hover:bg-[#1E293B] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]"
              )}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Interaction Area */}
        <div className="w-full flex flex-col items-center gap-10">
          {/* Visualizer / Pulse */}
          <div className="relative flex items-center justify-center w-64 h-64">
            <AnimatePresence>
              {isConnected && (
                <>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 4, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute inset-0 bg-[#0891B2] dark:bg-[#2DD4BF] rounded-[40%] blur-2xl"
                    style={{ borderRadius: '45% 55% 40% 60% / 55% 45% 60% 40%' }}
                  />
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.2 }}
                    className="absolute inset-8 border border-[#0891B2]/30 dark:border-[#2DD4BF]/30 rounded-[50%]"
                  />
                </>
              )}
            </AnimatePresence>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleConnection}
              aria-label={isConnected ? "Disconnect from AYAARA" : "Connect to AYAARA"}
              className={cn(
                "relative z-20 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500",
                isConnected 
                  ? (isListening 
                      ? "bg-[#0891B2] dark:bg-[#2DD4BF] text-white dark:text-[#0F172A] shadow-[0_8px_32px_rgba(8,145,178,0.3)]" 
                      : "bg-[#0891B2]/80 dark:bg-[#2DD4BF]/80 text-white dark:text-[#0F172A] shadow-lg")
                  : "bg-white dark:bg-[#1E293B] text-[#6B7280] dark:text-[#94A3B8] shadow-sm hover:shadow-md hover:text-[#0891B2] dark:hover:text-[#2DD4BF]"
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
          <div className="w-full flex flex-col items-center gap-4 px-4 max-w-2xl">
            <div className="flex items-center justify-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-[#6B7280] dark:text-[#94A3B8]">
              <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-[#10B981] animate-pulse" : "bg-[#D1D5DB] dark:bg-[#475569]")} />
              {status}
            </div>
            
            <div className="max-h-[320px] overflow-y-auto w-full space-y-6 px-4 py-2 scrollbar-hide flex flex-col">
              <AnimatePresence mode="popLayout">
                {messages.length === 0 && !isConnected && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[15px] italic text-center text-[#6B7280] dark:text-[#94A3B8]"
                  >
                    Tap the microphone to start your session
                  </motion.p>
                )}
                {messages.map((msg, idx) => {
                  const { cleanText, buttons } = parseButtons(msg.text);
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "w-full flex flex-col gap-3",
                        msg.role === 'user' ? "items-end" : "items-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-[90%] md:max-w-[80%] p-5 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                        msg.role === 'user' 
                          ? "bg-[#0891B2]/10 dark:bg-[#2DD4BF]/10 text-[#0F172A] dark:text-[#F8FAFC] rounded-tr-sm border border-[#0891B2]/20" 
                          : "bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F1F5F9] rounded-tl-sm font-serif"
                      )}>
                        {cleanText}
                      </div>
                      
                      {buttons.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {buttons.map((btn, bIdx) => (
                            <motion.button
                              key={bIdx}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleActionClick(btn)}
                              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#0891B2] dark:text-[#2DD4BF] text-[12px] font-semibold tracking-wide hover:bg-[#F5F5F0] dark:hover:bg-[#334155] transition-colors shadow-sm"
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
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        </div>

        {/* Activities & Relief (Scrollable Row) */}
        <div className="w-full flex flex-col gap-4 px-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8] flex items-center gap-2">
              <LayoutGrid size={14} className="text-[#0891B2] dark:text-[#2DD4BF]" />
              Wellness Activities
            </h3>
          </div>
          
          <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide snap-x px-2">
            {wellnessActivities.map((activity, idx) => (
              <motion.button
                key={idx}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => typeof activity.action === 'string' ? handleActionClick(activity.action) : activity.action()}
                className="snap-start flex-none w-[110px] h-[100px] flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-[#E2E8F0] dark:border-[#334155] text-[#475569] dark:text-[#94A3B8] hover:text-[#0891B2] dark:hover:text-[#2DD4BF] hover:border-[#0891B2]/30 dark:hover:border-[#2DD4BF]/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-[#F5F5F0] dark:bg-[#0F172A] flex items-center justify-center group-hover:bg-[#0891B2]/10 dark:group-hover:bg-[#2DD4BF]/10 transition-colors">
                  <activity.icon size={18} className="text-[#6B7280] dark:text-[#94A3B8] group-hover:text-[#0891B2] dark:group-hover:text-[#2DD4BF]" />
                </div>
                <span className="text-[12px] font-semibold">{activity.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Mood & Settings Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-xl border border-[#E2E8F0] dark:border-[#334155] rounded-3xl p-6 space-y-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8] flex items-center gap-2">
                <Heart size={14} className="text-[#0891B2] dark:text-[#2DD4BF]" />
                How are you feeling?
              </h3>
              {mood && <span className="text-[#0891B2] dark:text-[#2DD4BF] font-serif font-medium">{mood}/10</span>}
            </div>
            
            <div className="flex justify-between gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                <button
                  key={val}
                  onClick={() => handleMoodSelect(val)}
                  className={cn(
                    "flex-1 h-10 rounded-xl text-[12px] font-semibold transition-all duration-300",
                    mood === val 
                      ? "bg-[#0891B2] dark:bg-[#2DD4BF] text-white dark:text-[#0F172A] shadow-md" 
                      : "bg-[#F5F5F0] dark:bg-[#0F172A] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] text-[#6B7280] dark:text-[#94A3B8]"
                  )}
                >
                  {val}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-xl border border-[#E2E8F0] dark:border-[#334155] rounded-3xl p-6 space-y-5 shadow-sm flex flex-col justify-center"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8] flex items-center gap-2">
                <Mic size={14} className="text-[#0891B2] dark:text-[#2DD4BF]" />
                Mic Sensitivity
              </h3>
              <span className="text-[#0891B2] dark:text-[#2DD4BF] font-mono text-[11px] font-medium">{Math.round(sensitivity * 100)}%</span>
            </div>
            <div className="px-1">
              <input 
                type="range" 
                min="0" 
                max="3" 
                step="0.1" 
                value={sensitivity} 
                onChange={handleSensitivityChange}
                className="w-full h-2 bg-[#F5F5F0] dark:bg-[#0F172A] rounded-lg appearance-none cursor-pointer accent-[#0891B2] dark:accent-[#2DD4BF]"
              />
            </div>
            <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest text-[#94A3B8] dark:text-[#475569] px-1">
              <span>Low</span>
              <span>Normal</span>
              <span>High</span>
            </div>
          </motion.div>
        </div>

        {/* Safety Footer */}
        <footer className="w-full mt-4 pt-6 border-t border-[#E2E8F0] dark:border-[#334155] flex flex-col md:flex-row items-center justify-between gap-4 text-[#94A3B8] dark:text-[#475569] text-[11px] font-semibold uppercase tracking-wider px-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} />
            Supportive Companion • Not Medical Advice
          </div>
          <div className="flex items-center gap-6">
            <button className="hover:text-[#0F172A] dark:hover:text-[#F8FAFC] transition-colors">Help Resources</button>
            <button className="hover:text-[#0F172A] dark:hover:text-[#F8FAFC] transition-colors">Privacy</button>
          </div>
        </footer>
      </main>

    </div>
  );
}
