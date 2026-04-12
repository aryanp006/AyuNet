import { useState } from "react";
import { AlertTriangle, Shield } from "lucide-react";
import { api } from "../lib/api";
import GraphView from "./GraphView";

const PATIENTS = [
  { id: "aryan", name: "Aryan", language: "hi", conditions: "Dengue (Active)" },
  { id: "priya", name: "Priya", language: "hi", conditions: "Dengue + Diabetes" },
  { id: "karthik", name: "Karthik", language: "ta", conditions: "Post-surgery" },
  { id: "ananya", name: "Ananya", language: "te", conditions: "Undiagnosed" },
  { id: "rahul", name: "Rahul", language: "en", conditions: "Hypertension + Diabetes + CAD" },
  { id: "meera", name: "Meera", language: "bn", conditions: "New patient" },
];

export default function RiskAnalysisTab() {
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleAnalyze() {
    if (!selected) return;
    setLoading(true);
    try {
      const data = await api.patientRisks(selected);
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const graphNodes = result ? buildRiskNodes(result) : [];
  const graphEdges = result ? buildRiskEdges(result) : [];
  const animSeq = result ? buildRiskAnimation(result) : [];

  return (
    <div className="h-full flex gap-6">
      {/* Left Panel */}
      <div className="w-[380px] shrink-0 flex flex-col gap-4">
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-none">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
            Select Patient
          </h3>
          <div className="space-y-2">
            {PATIENTS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                  selected === p.id
                    ? "bg-yellow-100 dark:bg-yellow-500/20 border border-yellow-500"
                    : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-yellow-500/50"
                }`}
              >
                <div className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</div>
                <div className="text-xs text-slate-500">
                  {p.language.toUpperCase()} | {p.conditions}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !selected}
            className="w-full mt-4 bg-yellow-600 hover:bg-yellow-500 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            Predict Comorbidity Risk
          </button>
        </div>

        {/* Risk predictions */}
        {result?.risks?.predictions && (
          <div className="flex-1 overflow-y-auto space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Risk Predictions (4-hop)
            </h4>
            {result.risks.predictions.map((p: any, i: number) => (
              <div
                key={i}
                className={`rounded-xl p-4 border shadow-sm dark:shadow-none ${
                  p.risk_score > 1.5
                    ? "bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/50"
                    : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-white/10"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {p.risk_score > 1.5 && (
                    <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 animate-pulse" />
                  )}
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {p.predicted_disease}
                  </span>
                  <span
                    className={`ml-auto font-mono text-sm font-bold ${
                      p.risk_score > 1.5 ? "text-red-500 dark:text-red-400" : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {p.risk_score.toFixed(1)}x
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <div>Via: {p.via_risk_factor}</div>
                  <div>Test: {p.required_test}</div>
                  <div>
                    {p.test_completed ? (
                      <span className="text-green-600 dark:text-green-400">Test completed</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">Test NOT done</span>
                    )}
                  </div>
                </div>
                {/* Risk bar */}
                <div className="mt-2 relative">
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        p.risk_score > 1.5 ? "bg-red-500" : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(p.risk_score * 33, 100)}%` }}
                    />
                  </div>
                  {/* Threshold line at 1.5x */}
                  <div
                    className="absolute top-0 h-2 w-0.5 bg-slate-400 dark:bg-white/50"
                    style={{ left: "50%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Graph */}
      <div className="flex-1 min-h-[500px]">
        {graphNodes.length > 0 ? (
          <GraphView
            nodes={graphNodes}
            edges={graphEdges}
            animationSequence={animSeq}
            layout="concentric"
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-slate-100 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-white/10">
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              Select a patient to see comorbidity risk analysis
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function buildRiskNodes(result: any) {
  const nodes: any[] = [];
  const seen = new Set<string>();

  nodes.push({
    id: result.patient_id || "patient",
    label: result.patient_id || "Patient",
    type: "Patient",
    hop: 0,
  });

  result.risks?.hop1_existing_diseases?.forEach((d: string) => {
    if (!seen.has(d)) {
      nodes.push({ id: d, label: d, type: "Disease", hop: 1 });
      seen.add(d);
    }
  });

  result.risks?.hop2_risk_factors?.forEach((r: string) => {
    if (!seen.has(r)) {
      nodes.push({ id: r, label: r, type: "RiskFactor", hop: 2 });
      seen.add(r);
    }
  });

  result.risks?.hop3_predicted_diseases?.forEach((d: string) => {
    if (!seen.has(d)) {
      nodes.push({ id: `pred_${d}`, label: d, type: "Disease", hop: 3, score: 0.8 });
      seen.add(d);
    }
  });

  result.risks?.hop4_required_tests?.forEach((t: string) => {
    if (!seen.has(t)) {
      nodes.push({ id: t, label: t, type: "LabTest", hop: 4 });
      seen.add(t);
    }
  });

  return nodes;
}

function buildRiskEdges(result: any) {
  const edges: any[] = [];
  const pid = result.patient_id || "patient";

  result.risks?.hop1_existing_diseases?.forEach((d: string) => {
    edges.push({ source: pid, target: d, label: "has" });
  });

  result.risks?.predictions?.forEach((p: any) => {
    edges.push({
      source: p.via_risk_factor,
      target: `pred_${p.predicted_disease}`,
      label: `${p.risk_score.toFixed(1)}x`,
      weight: p.risk_score / 3,
    });
    if (p.required_test) {
      edges.push({
        source: `pred_${p.predicted_disease}`,
        target: p.required_test,
        label: "needs",
      });
    }
  });

  return edges;
}

function buildRiskAnimation(result: any) {
  const pid = result.patient_id || "patient";
  return [
    { hop: 1, nodes: [pid], edges: [] },
    { hop: 2, nodes: result.risks?.hop1_existing_diseases || [], edges: [] },
    { hop: 3, nodes: result.risks?.hop2_risk_factors || [], edges: [] },
    {
      hop: 4,
      nodes: [
        ...(result.risks?.hop3_predicted_diseases?.map((d: string) => `pred_${d}`) || []),
        ...(result.risks?.hop4_required_tests || []),
      ],
      edges: [],
    },
  ];
}
