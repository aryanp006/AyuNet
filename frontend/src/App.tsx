import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  ChevronRight,
  ScanSearch,
  Network,
  Dna,
  Pill,
  BrainCircuit,
  Volume2,
  Mic,
  Wifi,
  Battery,
  CheckCheck,
  Shield
} from 'lucide-react';

export default function App() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ayunet-theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ayunet-theme', theme);
  }, [theme]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="relative min-h-screen bg-[#ece8f4] dark:bg-[#060510] text-slate-900 dark:text-white overflow-hidden transition-colors duration-300">
      
      {/* --- Ambient Background --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Soft purple-tinted glow */}
        <div className="absolute top-1/2 left-1/2 w-[900px] h-[900px] bg-violet-400/8 dark:bg-violet-500/15 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-indigo-400/6 dark:bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] bg-fuchsia-400/5 dark:bg-fuchsia-500/8 blur-[100px] rounded-full" />
        
        {/* SVG Shape Outlines — gentle float */}
        <svg className="absolute top-[8%] left-[3%] w-[320px] h-[320px] text-violet-500/20 dark:text-violet-400/10" viewBox="0 0 200 200" style={{ animation: "shapeFloat 22s ease-in-out infinite" }}>
          <polygon points="100,10 180,50 180,120 100,160 20,120 20,50" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
        <svg className="absolute top-[25%] right-[8%] w-[260px] h-[260px] text-indigo-500/18 dark:text-indigo-400/10" viewBox="0 0 200 200" style={{ animation: "shapeFloat2 26s ease-in-out infinite" }}>
          <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
        <svg className="absolute bottom-[12%] left-[18%] w-[220px] h-[220px] text-emerald-500/15 dark:text-emerald-400/8" viewBox="0 0 200 200" style={{ animation: "shapeFloat 24s ease-in-out infinite" }}>
          <polygon points="100,15 190,175 10,175" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
        <svg className="absolute top-[55%] right-[25%] w-[160px] h-[160px] text-amber-500/15 dark:text-amber-400/8" viewBox="0 0 200 200" style={{ animation: "shapeFloat2 18s ease-in-out infinite" }}>
          <polygon points="50,5 95,50 50,95 5,50" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
        {/* Side & corner outlines */}
        <svg className="absolute top-[45%] left-[8%] w-[200px] h-[200px] text-violet-500/15 dark:text-violet-400/8" viewBox="0 0 200 200" style={{ animation: "shapeFloat2 28s ease-in-out infinite" }}>
          <rect x="30" y="30" width="140" height="140" rx="20" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
        <svg className="absolute top-[5%] right-[35%] w-[140px] h-[140px] text-indigo-500/12 dark:text-indigo-400/6" viewBox="0 0 200 200" style={{ animation: "shapeFloat 30s ease-in-out infinite" }}>
          <polygon points="100,10 150,75 130,150 70,150 50,75" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
        <svg className="absolute bottom-[25%] right-[5%] w-[180px] h-[180px] text-fuchsia-500/12 dark:text-fuchsia-400/6" viewBox="0 0 200 200" style={{ animation: "shapeFloat2 20s ease-in-out infinite" }}>
          <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </svg>
        {/* Middle-zone shapes to fill vertical center */}
        <svg className="absolute top-[38%] left-[40%] w-[280px] h-[280px] text-violet-500/12 dark:text-violet-400/6" viewBox="0 0 200 200" style={{ animation: "shapeFloat 25s ease-in-out infinite" }}>
          <polygon points="100,5 130,40 130,100 100,135 70,100 70,40" fill="none" stroke="currentColor" strokeWidth="0.8" />
        </svg>
        <svg className="absolute top-[48%] right-[40%] w-[200px] h-[200px] text-indigo-500/10 dark:text-indigo-400/5" viewBox="0 0 200 200" style={{ animation: "shapeFloat2 22s ease-in-out infinite" }}>
          <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </svg>
        <svg className="absolute top-[32%] left-[55%] w-[160px] h-[160px] text-fuchsia-500/10 dark:text-fuchsia-400/5" viewBox="0 0 200 200" style={{ animation: "shapeFloat 19s ease-in-out infinite" }}>
          <rect x="20" y="50" width="160" height="100" rx="15" fill="none" stroke="currentColor" strokeWidth="0.8" />
        </svg>
      </div>

      {/* --- Navbar --- */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Network className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">AyuNet</span>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-[13px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <a href="#platform" className="hover:text-fuchsia-500 transition-colors">Platform</a>
            <a href="#features" className="hover:text-indigo-500 transition-colors">Features</a>
            <a href="#voice" className="hover:text-violet-500 transition-colors">Indic Voice</a>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button onClick={() => navigate('/dashboard')} className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-6 py-2.5 rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              Go to Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative z-10 pt-40 pb-32">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="relative z-10"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 backdrop-blur-sm mb-8">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Neo4j Graph + Indic Voice AI</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
              Healthcare <br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500">
                in your language.
              </span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-xl text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed mb-10">
              AyuNet combines multi-hop graph traversals with regional voice intelligence. Transform patient symptoms into precise, data-driven diagnoses—spoken aloud in Hindi, Tamil, Telugu, and more.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
              <button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-2xl shadow-indigo-600/25 group">
                Launch Intelligence
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl font-bold transition-all">
                View Architecture
              </button>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative h-[650px] flex items-center justify-center"
          >
            {/* Ambient Base Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-tr from-indigo-500/30 to-fuchsia-500/30 blur-[100px] rounded-full z-0" />
            
            {/* Rotating Aura Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] z-0 pointer-events-none">
              <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                 className="w-full h-full relative opacity-60"
              >
                 <div className="absolute top-0 right-0 w-[250px] h-[250px] rounded-full bg-gradient-to-bl from-amber-500/40 to-rose-500/20 blur-[60px]" />
                 <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-emerald-500/40 to-teal-500/20 blur-[80px]" />
                 <div className="absolute top-1/4 left-1/4 w-[180px] h-[180px] rounded-full bg-gradient-to-tr from-fuchsia-500/50 to-violet-500/30 blur-[50px]" />
                 
                 {/* Little rotating particles in the aura */}
                 <div className="absolute top-10 right-1/4 w-3 h-3 bg-white/40 rounded-full blur-[2px]" />
                 <div className="absolute bottom-20 left-1/3 w-4 h-4 bg-fuchsia-400/50 rounded-full blur-[3px]" />
                 <div className="absolute top-1/2 left-10 w-2 h-2 bg-emerald-400/60 rounded-full blur-[1px]" />
              </motion.div>
            </div>
            
            {/* Floating features */}
            <motion.div className="absolute top-[15%] -left-[5%] p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-40 hidden md:block" animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity }}>
              <div className="flex items-center gap-3 pr-2">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Volume2 className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Indic Voice</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">Sarvam AI</span>
                </div>
              </div>
            </motion.div>

            <motion.div className="absolute bottom-[20%] -right-[5%] p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-40 hidden md:block" animate={{ y: [0, 8, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 1 }}>
              <div className="flex items-center gap-3 pr-2">
                <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Network className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Graph DB</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">Neo4j Integration</span>
                </div>
              </div>
            </motion.div>

            {/* Mobile Phone Mockup */}
            <div className="relative w-full max-w-[320px] h-[600px] bg-[#0E0E11] rounded-[3rem] border-[8px] border-slate-900 shadow-[0_0_80px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden z-30 ring-1 ring-white/10 -rotate-6 hover:rotate-0 transition-transform duration-700 ease-out origin-center">
               {/* Mobile Notch */}
               <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
                  <div className="w-24 h-5 bg-slate-900 rounded-b-2xl"></div>
               </div>
               
               {/* Status Bar Mock */}
               <div className="px-6 pt-3 pb-2 flex justify-between items-center text-[10px] text-white/90 font-bold tracking-wider z-40 relative">
                 <span>10:42</span>
                 <div className="flex gap-1.5 items-center">
                    <Wifi className="w-3.5 h-3.5" />
                    <Battery className="w-4 h-4" />
                 </div>
               </div>

               {/* App Header */}
               <div className="px-5 py-3 border-b border-white/10 flex items-center gap-3 bg-slate-900/50 backdrop-blur-md relative z-40">
                 <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shrink-0">
                   <Network className="w-4 h-4 text-indigo-400" />
                 </div>
                 <div className="flex-1">
                   <p className="text-white text-[13px] font-bold leading-tight">AyuNet Hub</p>
                   <p className="text-emerald-400 text-[10px] flex items-center gap-1 font-semibold uppercase tracking-widest mt-0.5">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                     online
                   </p>
                 </div>
               </div>

               {/* Chat Body */}
               <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto relative no-scrollbar bg-[#0E0E11]">
                 {/* subtle background glow */}
                 <div className="absolute top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none" />
                 
                 {/* Security notice */}
                 <div className="flex justify-center mb-2">
                    <span className="text-[9px] text-white/40 bg-white/5 px-3 py-1 rounded-full flex items-center gap-1 font-medium">
                      <Shield className="w-2.5 h-2.5" /> Messages are end-to-end encrypted
                    </span>
                 </div>

                 {/* Bot message */}
                 <div className="bg-slate-800/80 rounded-2xl rounded-tl-sm p-3.5 pb-5 text-[12px] text-white max-w-[85%] border border-white/5 relative z-10 shadow-lg">
                    <p className="mb-1 leading-relaxed text-sm"><span className="text-xl inline-block mr-1">🙏</span> नमस्ते! मैं AyuNet AI हूँ।</p>
                    <p className="leading-relaxed opacity-90 text-[11px]">आप आज कैसा महसूस कर रहे हैं?</p>
                    <span className="text-[9px] text-white/40 absolute bottom-1.5 right-2 font-medium">10:42 am</span>
                 </div>

                 {/* User Voice Message Mock with transcription */}
                 <div className="bg-emerald-600 rounded-2xl rounded-tr-sm p-3 text-[11px] text-white max-w-[90%] self-end relative z-10 shadow-lg flex flex-col gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                         <Volume2 className="w-4 h-4 text-white" />
                      </div>
                      {/* waveform mock */}
                      <div className="flex gap-[3px] items-center h-4">
                         <span className="w-[2px] h-2 bg-white/70 rounded-full" />
                         <span className="w-[2px] h-3 bg-white/90 rounded-full" />
                         <span className="w-[2px] h-5 bg-white rounded-full lg:animate-pulse" />
                         <span className="w-[2px] h-3 bg-white/80 rounded-full" />
                         <span className="w-[2px] h-2 bg-white/60 rounded-full" />
                         <span className="w-[2px] h-4 bg-white/90 rounded-full" />
                         <span className="w-[2px] h-2 bg-white/70 rounded-full" />
                      </div>
                      <span className="ml-2 opacity-90 font-bold text-[10px]">0:12</span>
                    </div>
                    {/* Transcription */}
                    <div className="mt-1 pt-2 border-t border-white/20">
                      <p className="opacity-70 text-[9px] uppercase tracking-wider mb-0.5">Live Transcription:</p>
                      <p className="italic font-medium leading-relaxed">"मुझे कल रात से बुखार है और पेट में भी दर्द हो रहा है।"</p>
                    </div>
                    <span className="text-[9px] text-emerald-200 absolute -bottom-5 right-1 flex items-center gap-0.5 font-medium">
                       10:42 am <CheckCheck className="w-3 h-3" />
                    </span>
                 </div>

                 {/* Bot Followup processing */}
                 <div className="mt-7 bg-indigo-900/40 rounded-2xl rounded-tl-sm p-3 text-[11px] text-indigo-50 max-w-[95%] border border-indigo-500/20 relative z-10 shadow-lg">
                    <div className="flex items-start gap-2 mb-3 pb-2 border-b border-indigo-500/20">
                      <BrainCircuit className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-indigo-300 text-[10px] uppercase tracking-wider mb-1">Graph Diagnosis Match</p>
                        <p className="text-[10px] opacity-90 font-medium">Symptoms: <span className="bg-indigo-500/30 px-1 py-0.5 rounded text-indigo-100">Fever</span> <span className="bg-indigo-500/30 px-1 py-0.5 rounded text-indigo-100">Abdominal Pain</span></p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                       <div className="bg-slate-900/60 rounded-xl p-2.5 border border-white/5 flex justify-between items-center hover:bg-slate-800 transition-colors cursor-pointer">
                         <div>
                           <p className="font-bold text-white text-[12px] mb-0.5">Viral Gastroenteritis</p>
                           <p className="text-[10px] text-emerald-400 font-medium">Primary care advised</p>
                         </div>
                         <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] px-2 py-0.5 rounded-full font-bold">96%</span>
                       </div>
                       
                       <div className="bg-slate-900/60 rounded-xl p-2.5 border border-white/5 flex justify-between items-center hover:bg-slate-800 transition-colors cursor-pointer">
                         <div>
                           <p className="font-bold text-white text-[12px] mb-0.5">Typhoid Fever</p>
                           <p className="text-[10px] text-amber-300 font-medium">Prescribe Widal Test</p>
                         </div>
                         <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] px-2 py-0.5 rounded-full font-bold">82%</span>
                       </div>
                    </div>
                 </div>
               </div>

               {/* Bottom Input Area Mock */}
               <div className="p-3 pt-2 pb-5 border-t border-white/10 bg-[#0E0E11]/95 relative z-40">
                 <div className="w-full bg-slate-800 rounded-full pl-4 pr-1.5 py-1.5 border border-white/10 flex items-center justify-between shadow-inner">
                    <span className="text-[12px] text-slate-400 font-medium">Type a message...</span>
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20 cursor-pointer">
                       <Mic className="w-4 h-4 text-white" />
                    </div>
                 </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Indic Voice & Graph Section --- */}
      <section className="relative z-10 py-32 border-y border-slate-200 dark:border-white/10 bg-gradient-to-b from-indigo-50/50 to-white dark:from-slate-900/50 dark:to-slate-950 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            
            {/* Visual Box with glowing outline */}
            <div className="relative group p-1 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-[2.5rem] shadow-[0_0_50px_rgba(99,102,241,0.2)]">
              <div className="bg-white dark:bg-slate-950 rounded-[2.4rem] overflow-hidden border border-slate-200 dark:border-white/5 h-full">
                <div className="flex flex-col h-full">
                  <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Volume2 className="h-4 w-4 text-amber-500" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Sarvam AI STT</span>
                      <span className="ml-auto text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full shadow-lg">HINDI PREVIEW</span>
                    </div>
                    <div className="p-5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-semibold italic text-slate-700 dark:text-slate-200 shadow-inner relative z-10">
                      "Mujhe do din se bukhar hai aur pet mein dard bhi ho raha hai."
                    </div>
                  </div>
                  <div className="p-6 relative bg-slate-900">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 blur-3xl rounded-full" />
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <Network className="h-4 w-4 text-indigo-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Neo4j Cypher Query</span>
                    </div>
                    <div className="bg-[#0D1117] p-5 rounded-2xl border border-indigo-500/30 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                      <pre className="font-mono text-xs text-emerald-400 leading-loose relative z-10 overflow-x-auto">
{`MATCH (s:Symptom)<-[r:HAS_SYMPTOM]-(d:Disease)
WHERE s.name IN ["fever", "abdominal_pain"]
WITH d, count(s) AS matched,
     sum(r.weight) AS score
RETURN d.name, matched, score
ORDER BY score DESC LIMIT 5`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Box */}
            <div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                Speak globally.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-fuchsia-500">Process natively.</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-10 font-medium">
                Patients communicate in their native language using Sarvam AI. Our platform translates, extracts structured symptoms, and runs multi-hop Cypher queries on Neo4j in real-time for instant diagnosis.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 hover:shadow-xl hover:border-indigo-500/30 transition-all group">
                  <div className="mt-1 h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <ChevronRight className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Automated Follow-ups</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Query `getDueFollowups()` generates tailored scripts and initiates calls via Sarvam AI.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 hover:shadow-xl hover:border-rose-500/30 transition-all group">
                  <div className="mt-1 h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Activity className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Risk Flag Automation</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Instant WebSocket alerts to doctors if patient-reported vitals exceed critical limits.</p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* --- Feature Grid --- */}
      <section className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full -z-10" />
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">Graph Intelligence</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
              AyuNet utilizes advanced Neo4j graph infrastructure to traverse deep clinical networks faster than relational SQL databases ever could.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Network} 
              title="Multi-hop Traversal"
              desc="4-hop Cypher queries mapping symptoms to diseases, finding underlying causes for rare presentations." 
              color="indigo" 
            />
            <FeatureCard 
              icon={Pill} 
              title="Drug Interaction" 
              desc="Lightning-fast pattern matching finds moderate and severe inter-drug conflicts and alternatives." 
              color="rose" 
            />
            <FeatureCard 
              icon={Dna} 
              title="Comorbidity Risk" 
              desc="Accumulates multiplier scores across patient history to predict disease likelihood accurately." 
              color="emerald" 
            />
            <FeatureCard 
              icon={Activity} 
              title="Treatment Pathways" 
              desc="Shortest-path algorithms guide patients from initial symptom to the best specialist securely." 
              color="amber" 
            />
            <FeatureCard 
              icon={ScanSearch} 
              title="Audio OCR Pipeline" 
              desc="Analyze bills via Groq, extracting precise clinical data and streaming real-time alerts." 
              color="violet" 
            />
            <FeatureCard 
              icon={BrainCircuit} 
              title="Disease PageRank" 
              desc="Degree centrality analysis to weigh differential diagnoses by graph connectivity." 
              color="sky" 
            />
          </div>
        </div>
      </section>

      {/* --- Footer CTA --- */}
      <footer className="relative py-16 text-center overflow-hidden isolate">
        {/* Opaque base — blocks main page bg */}
        <div className="absolute inset-0 bg-[#eee8f7] dark:bg-[#07060e] -z-30" />

        {/* Aurora layer 1 */}
        <div className="absolute inset-0 -z-20 opacity-70 dark:opacity-50" style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(139,92,246,0.25), transparent)', animation: 'auroraMove1 10s ease-in-out infinite alternate' }} />
        {/* Aurora layer 2 */}
        <div className="absolute inset-0 -z-20 opacity-60 dark:opacity-40" style={{ background: 'radial-gradient(ellipse 70% 70% at 80% 40%, rgba(99,102,241,0.2), transparent)', animation: 'auroraMove2 12s ease-in-out infinite alternate' }} />
        {/* Aurora layer 3 */}
        <div className="absolute inset-0 -z-20 opacity-50 dark:opacity-30" style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 80%, rgba(192,132,252,0.2), transparent)', animation: 'auroraMove3 14s ease-in-out infinite alternate' }} />

        {/* Animated top separator line */}
        <div className="absolute top-0 left-0 w-full h-px overflow-hidden -z-10">
          <motion.div 
            className="h-full w-[200%] bg-gradient-to-r from-transparent via-violet-500 to-transparent"
            animate={{ x: ['-50%', '0%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Floating shape outlines */}
        <svg className="absolute top-[10%] left-[5%] w-[120px] h-[120px] text-violet-500/40 dark:text-violet-400/12 -z-10" viewBox="0 0 200 200" style={{ animation: "shapeFloat2 16s ease-in-out infinite" }}>
          <polygon points="100,10 180,50 180,120 100,160 20,120 20,50" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <svg className="absolute bottom-[15%] right-[8%] w-[100px] h-[100px] text-indigo-500/35 dark:text-indigo-400/12 -z-10" viewBox="0 0 200 200" style={{ animation: "shapeFloat 20s ease-in-out infinite" }}>
          <polygon points="100,15 190,175 10,175" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <svg className="absolute top-[20%] right-[15%] w-[90px] h-[90px] text-fuchsia-500/30 dark:text-fuchsia-400/10 -z-10" viewBox="0 0 200 200" style={{ animation: "shapeFloat2 22s ease-in-out infinite" }}>
          <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <svg className="absolute bottom-[10%] left-[20%] w-[80px] h-[80px] text-indigo-500/30 dark:text-indigo-400/8 -z-10" viewBox="0 0 200 200" style={{ animation: "shapeFloat 18s ease-in-out infinite" }}>
          <polygon points="50,5 95,50 50,95 5,50" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <svg className="absolute top-[40%] left-[35%] w-[70px] h-[70px] text-violet-500/25 dark:text-violet-400/8 -z-10" viewBox="0 0 200 200" style={{ animation: "shapeFloat2 24s ease-in-out infinite" }}>
          <rect x="30" y="30" width="140" height="140" rx="20" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
            className="h-16 w-16 bg-gradient-to-tr from-indigo-500 via-violet-500 to-fuchsia-500 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/30 hover:scale-110 transition-transform cursor-pointer"
          >
            <Network className="h-8 w-8 text-white" />
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-3xl font-black mb-8 text-slate-900 dark:text-white"
          >
            Ready to revolutionize care?
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <button onClick={() => navigate('/dashboard')} className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold rounded-2xl hover:scale-105 transition-transform shadow-2xl shadow-slate-900/20 dark:shadow-white/20 text-base">
              Open Dashboard Environment
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 text-xs font-bold uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400"
          >
            &copy; 2026 AyuNet Core | Neo4j
          </motion.div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, color }: { icon: any, title: string, desc: string, color: string }) {
  const colorMap: Record<string, string> = {
    indigo: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 group-hover:border-indigo-500 shadow-indigo-500/10",
    rose: "text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 group-hover:border-rose-500 shadow-rose-500/10",
    emerald: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 group-hover:border-emerald-500 shadow-emerald-500/10",
    amber: "text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 group-hover:border-amber-500 shadow-amber-500/10",
    violet: "text-violet-500 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30 group-hover:border-violet-500 shadow-violet-500/10",
    sky: "text-sky-500 bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30 group-hover:border-sky-500 shadow-sky-500/10",
  };

  const styleClass = colorMap[color] || colorMap.indigo;

  return (
    <div className={`p-8 rounded-[2rem] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 hover:-translate-y-2 transition-all duration-300 group hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] ${styleClass.split(' ').find(c => c.startsWith('shadow-'))}`}>
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 ${styleClass.split(' ').filter(c => !c.startsWith('group-hover') && !c.startsWith('shadow-')).join(' ')}`}>
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-black mb-3 text-slate-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-600 dark:group-hover:from-white dark:group-hover:to-slate-400">{title}</h3>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
