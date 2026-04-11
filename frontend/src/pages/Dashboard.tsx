import { useState, useEffect } from "react";
import {
  Network,
  Search,
  Pill,
  ArrowRight,
  Shield,
  Phone,
  Bell,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useWebSocket } from "../hooks/useWebSocket";
import DiagnoseTab from "../components/DiagnoseTab";
import DrugCheckTab from "../components/DrugCheckTab";
import TreatmentPathTab from "../components/TreatmentPathTab";
import RiskAnalysisTab from "../components/RiskAnalysisTab";
import FollowupsTab from "../components/FollowupsTab";

const TABS = [
  { id: "diagnose", label: "Diagnose", icon: Search, color: "indigo" },
  { id: "drugs", label: "Drug Check", icon: Pill, color: "green" },
  { id: "treatment", label: "Treatment Path", icon: ArrowRight, color: "orange" },
  { id: "risks", label: "Risk Analysis", icon: Shield, color: "yellow" },
  { id: "followups", label: "Follow-ups", icon: Phone, color: "fuchsia" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("diagnose");
  const { alerts, latestAlert, connected, clearLatest } = useWebSocket();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ayunet-theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ayunet-theme', theme);
  }, [theme]);

  const riskAlerts = alerts.filter((a) => a.type === "risk_alert");

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-[#060510] text-slate-900 dark:text-white overflow-hidden transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/80 backdrop-blur flex flex-col transition-colors">
        {/* Logo */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10">
          <a href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Network className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">
              AyuNet
            </span>
          </a>
        </div>

        {/* Nav tabs */}
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === "followups" && riskAlerts.length > 0 && (
                  <span className="ml-auto w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center animate-pulse">
                    {riskAlerts.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Connection status */}
        <div className="p-4 border-t border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            {connected ? "WebSocket connected" : "Disconnected"}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-6 bg-white/60 dark:bg-slate-950/60 backdrop-blur shrink-0 transition-colors">
          <h2 className="font-bold text-sm uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {TABS.find((t) => t.id === activeTab)?.label}
          </h2>

          <div className="flex items-center gap-3">
            {riskAlerts.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded-full">
                <Bell className="w-3.5 h-3.5 text-red-500 dark:text-red-400 animate-pulse" />
                <span className="text-xs font-bold text-red-600 dark:text-red-300">
                  {riskAlerts.length} Alert{riskAlerts.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Alert toast */}
        {latestAlert && latestAlert.type === "risk_alert" && (
          <div className="mx-6 mt-3 bg-red-500/10 dark:bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top">
            <Bell className="w-5 h-5 text-red-500 dark:text-red-400 animate-pulse shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-red-600 dark:text-red-300 text-sm">
                Risk Alert: {latestAlert.patient_name}
              </p>
              <p className="text-xs text-red-500/80 dark:text-red-400/80">
                Pain: {latestAlert.pain_score} | New symptoms:{" "}
                {latestAlert.new_symptoms?.join(", ")}
              </p>
            </div>
            <button
              onClick={clearLatest}
              className="p-1 hover:bg-red-500/20 dark:hover:bg-red-500/30 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-red-500 dark:text-red-400" />
            </button>
          </div>
        )}

        {/* Tab content */}
        <div className="flex-1 p-6 overflow-hidden">
          {activeTab === "diagnose" && <DiagnoseTab />}
          {activeTab === "drugs" && <DrugCheckTab />}
          {activeTab === "treatment" && <TreatmentPathTab />}
          {activeTab === "risks" && <RiskAnalysisTab />}
          {activeTab === "followups" && <FollowupsTab alerts={alerts} />}
        </div>
      </main>
    </div>
  );
}
