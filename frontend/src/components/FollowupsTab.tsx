import { useState, useEffect } from "react";
import { Phone, PhoneOff, PhoneCall, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "../lib/api";
import type { Alert } from "../hooks/useWebSocket";

interface Props {
  alerts: Alert[];
}

export default function FollowupsTab({ alerts }: Props) {
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<Record<string, string>>({});
  const [transcripts, setTranscripts] = useState<Alert[]>([]);

  useEffect(() => {
    loadFollowups();
  }, []);

  useEffect(() => {
    const callAlerts = alerts.filter(
      (a) => a.type === "call_transcript" || a.type === "risk_alert"
    );
    setTranscripts(callAlerts);
  }, [alerts]);

  async function loadFollowups() {
    setLoading(true);
    try {
      const data = await api.dueFollowups();
      setFollowups(data.followups?.patients || []);
    } catch (err) {
      console.error(err);
      setFollowups([
        {
          patient_id: "aryan",
          patient_name: "Aryan",
          phone: "+91-7985582272",
          language: "hi",
          condition: "Dengue Fever",
          followup_day: 1,
          scheduled_date: new Date().toISOString().split("T")[0],
        },
        {
          patient_id: "karthik",
          patient_name: "Karthik",
          phone: "+91-XXXXXXXX",
          language: "ta",
          condition: "Post-surgery",
          followup_day: 7,
          scheduled_date: new Date().toISOString().split("T")[0],
        },
        {
          patient_id: "priya",
          patient_name: "Priya",
          phone: "+91-XXXXXXXX",
          language: "hi",
          condition: "Dengue + Diabetes",
          followup_day: 3,
          scheduled_date: new Date().toISOString().split("T")[0],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCall(patientId: string) {
    setCallingId(patientId);
    setCallStatus((prev) => ({ ...prev, [patientId]: "preparing" }));

    try {
      await api.initiateCall(patientId);
      setCallStatus((prev) => ({
        ...prev,
        [patientId]: "ringing",
      }));
      setTimeout(() => {
        setCallStatus((prev) => ({
          ...prev,
          [patientId]: "in-progress",
        }));
      }, 3000);
    } catch (err) {
      console.error(err);
      setCallStatus((prev) => ({ ...prev, [patientId]: "failed" }));
    }
  }

  async function handleDemoTrigger() {
    setCallingId("demo");
    try {
      const data = await api.demoTrigger();
      if (data.patient) {
        setCallStatus((prev) => ({
          ...prev,
          [data.patient.patient_id]: "ringing",
        }));
      }
    } catch (err) {
      console.error(err);
    }
  }

  const statusColors: Record<string, string> = {
    preparing: "text-yellow-600 dark:text-yellow-400",
    ringing: "text-blue-600 dark:text-blue-400",
    "in-progress": "text-green-600 dark:text-green-400",
    completed: "text-slate-500 dark:text-slate-400",
    failed: "text-red-500 dark:text-red-400",
  };

  const statusIcons: Record<string, any> = {
    preparing: Clock,
    ringing: PhoneCall,
    "in-progress": Phone,
    completed: CheckCircle2,
    failed: PhoneOff,
  };

  return (
    <div className="h-full flex gap-6">
      {/* Left: Follow-up list */}
      <div className="w-[400px] shrink-0 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Today's Follow-ups
          </h3>
          <button
            onClick={handleDemoTrigger}
            className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Demo Trigger
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-slate-100 dark:bg-slate-900/60 rounded-xl animate-pulse border border-slate-200 dark:border-white/5"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-y-auto">
            {followups.map((fu) => {
              const status = callStatus[fu.patient_id];
              const StatusIcon = statusIcons[status] || Clock;

              return (
                <div
                  key={fu.patient_id}
                  className={`bg-white dark:bg-slate-900/60 backdrop-blur border rounded-xl p-4 transition-all shadow-sm dark:shadow-none ${
                    status === "in-progress"
                      ? "border-green-400 dark:border-green-500/50"
                      : status === "ringing"
                      ? "border-blue-400 dark:border-blue-500/50"
                      : "border-slate-200 dark:border-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{fu.patient_name}</h4>
                      <div className="text-xs text-slate-500 space-x-2">
                        <span>{fu.language?.toUpperCase()}</span>
                        <span>|</span>
                        <span>{fu.condition}</span>
                        <span>|</span>
                        <span>Day {fu.followup_day}</span>
                      </div>
                    </div>
                    {status && (
                      <div className={`flex items-center gap-1.5 ${statusColors[status]}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-xs font-bold">{status}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCall(fu.patient_id)}
                      disabled={!!callingId && callingId !== fu.patient_id}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        status === "in-progress"
                          ? "bg-red-600 hover:bg-red-500 text-white"
                          : "bg-green-600 hover:bg-green-500 text-white disabled:opacity-50"
                      }`}
                    >
                      {status === "in-progress" ? (
                        <>
                          <PhoneOff className="w-4 h-4" /> End Call
                        </>
                      ) : status === "ringing" ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Ringing...
                        </>
                      ) : status === "preparing" ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Preparing...
                        </>
                      ) : (
                        <>
                          <Phone className="w-4 h-4" /> Call Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Live transcript + alerts */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex-1 overflow-y-auto shadow-sm dark:shadow-none">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
            Live Call Transcript
          </h4>
          {transcripts.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-slate-400 dark:text-slate-500 text-sm">
                Call a patient to see the live transcript here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transcripts.map((t, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border ${
                    t.type === "risk_alert"
                      ? "bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/50"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-white/5"
                  }`}
                >
                  {t.type === "risk_alert" ? (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 animate-pulse" />
                      <span className="font-bold text-red-600 dark:text-red-300 text-sm">
                        RISK ALERT: {t.patient_name}
                      </span>
                      <span className="ml-auto text-xs text-red-500 dark:text-red-400">
                        Pain: {t.pain_score} | Symptoms: {t.new_symptoms?.join(", ")}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">
                        Turn {t.turn} | {t.call_sid?.slice(0, 10)}
                      </div>
                      <p className="text-sm text-slate-900 dark:text-white">{t.patient_speech}</p>
                      {t.extracted && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {t.extracted.pain_score != null && (
                            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">
                              Pain: {t.extracted.pain_score}
                            </span>
                          )}
                          {t.extracted.took_medication != null && (
                            <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300">
                              Medication: {t.extracted.took_medication ? "Yes" : "No"}
                            </span>
                          )}
                          {t.extracted.new_symptoms?.length > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300">
                              New: {t.extracted.new_symptoms.join(", ")}
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
