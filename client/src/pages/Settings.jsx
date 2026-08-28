import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Play, 
  RotateCcw, 
  Radio, 
  Sliders, 
  Activity, 
  ShieldAlert, 
  Cpu, 
  CheckCircle2, 
  Save,
  Volume2,
  Terminal
} from 'lucide-react';
import { fetchApi } from '../utils/api';
import { useLiveStream } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { refreshAll } = useLiveStream();
  const { user } = useAuth();

  const [settings, setSettings] = useState({
    mine_id: 'MINE_001',
    auto_escalate_critical_alerts: true,
    audio_alarm_enabled: true,
    audio_alarm_volume: 80,
    module_1_webhook_url: 'http://localhost:5000/api/alerts/ai',
    module_2_webhook_url: 'http://localhost:5000/api/alerts/miner',
    telemetry_poll_interval_sec: 3.5,
    ai_confidence_threshold_pct: 85
  });

  const [auditLogs, setAuditLogs] = useState([]);
  const [triggeringScenario, setTriggeringScenario] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchApi('/telemetry/settings')
      .then(res => res.data && setSettings(res.data))
      .catch(console.error);

    fetchApi('/telemetry/audit-logs')
      .then(res => res.data && setAuditLogs(res.data))
      .catch(console.error);
  }, []);

  const handleTriggerScenario = async (scenarioKey) => {
    setTriggeringScenario(scenarioKey);
    try {
      await fetchApi('/telemetry/scenario', {
        method: 'POST',
        body: JSON.stringify({ scenario: scenarioKey })
      });
      await refreshAll();
      const logsRes = await fetchApi('/telemetry/audit-logs');
      if (logsRes.data) setAuditLogs(logsRes.data);
    } catch (e) {
      alert('Error triggering scenario: ' + e.message);
    } finally {
      setTriggeringScenario(null);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/telemetry/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      alert('Error saving settings: ' + e.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/90 border border-white/10 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              INTEGRATION GATEWAY & SIMULATOR
            </span>
            <span className="text-xs font-mono text-slate-400">Section 11 System Settings</span>
          </div>
          <h1 className="text-xl font-display font-bold text-white tracking-wider mt-1 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            SYSTEM CONFIGURATION & LIVE SIMULATOR
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Module 1 / Module 2 Webhook Endpoints, Simulation Triggers, and Central Audit Logs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Live Scenario Simulator Engine */}
        <div className="glass-panel p-5 rounded-xl space-y-4 border border-cyan-500/30">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="font-display font-bold text-base text-white tracking-wider flex items-center gap-2">
              <Play className="w-4 h-4 text-cyan-400" />
              LIVE TELEMETRY SCENARIO SIMULATOR
            </h2>
            <span className="badge badge-info text-xs">DEMO ENGINE</span>
          </div>

          <p className="text-xs font-mono text-slate-300">
            Trigger real-time simulated telemetry events to evaluate Command Center alerts, map rendering, and rescue response workflows:
          </p>

          <div className="space-y-3 font-mono text-xs">
            {/* Scenario 1 */}
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-red-500/40 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-red-400 font-display text-sm">
                  1. Module 1: AI Strata Subsidence Surge (16.4 mm/hr)
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Simulates InSAR velocity breach in Sector 4 (ZONE_D) with AI collapse window &lt;28m.
                </div>
              </div>
              <button
                onClick={() => handleTriggerScenario('SUBSIDENCE_SURGE')}
                disabled={triggeringScenario !== null}
                className="btn btn-danger btn-sm text-xs flex-shrink-0"
              >
                {triggeringScenario === 'SUBSIDENCE_SURGE' ? 'Triggering...' : 'TRIGGER SCENARIO'}
              </button>
            </div>

            {/* Scenario 2 */}
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-red-500/40 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-amber-400 font-display text-sm">
                  2. Module 2: Smart Band Emergency SOS Trigger
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Simulates Alex Chen pressing physical SOS button with rockfall trauma & elevated HR (146 bpm).
                </div>
              </div>
              <button
                onClick={() => handleTriggerScenario('MINER_SOS')}
                disabled={triggeringScenario !== null}
                className="btn btn-danger btn-sm text-xs flex-shrink-0"
              >
                {triggeringScenario === 'MINER_SOS' ? 'Triggering...' : 'TRIGGER SCENARIO'}
              </button>
            </div>

            {/* Scenario 3 */}
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-amber-500/40 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-amber-300 font-display text-sm">
                  3. Module 1: Explosive Methane (2.85% CH4) Leak
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Simulates NDIR gas sensor NODE_004 exceeding Lower Explosive Limit.
                </div>
              </div>
              <button
                onClick={() => handleTriggerScenario('GAS_SPIKE')}
                disabled={triggeringScenario !== null}
                className="btn btn-outline btn-sm text-xs flex-shrink-0"
              >
                {triggeringScenario === 'GAS_SPIKE' ? 'Triggering...' : 'TRIGGER SCENARIO'}
              </button>
            </div>

            {/* Reset */}
            <div className="p-3.5 rounded-lg bg-slate-950 border border-white/10 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-slate-300 font-display text-sm">
                  Reset System State to Clean Initial Baseline
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Restores default zones, sensor nodes, miners, and clears testing alerts.
                </div>
              </div>
              <button
                onClick={() => handleTriggerScenario('RESET')}
                disabled={triggeringScenario !== null}
                className="btn btn-outline btn-sm text-xs flex items-center gap-1 flex-shrink-0 text-slate-300"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{triggeringScenario === 'RESET' ? 'Resetting...' : 'RESET DATA'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Gateway Endpoints & Settings */}
        <div className="glass-panel p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="font-display font-bold text-base text-white tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              INTEGRATION API ENDPOINTS (SECTION 8)
            </h2>
            {saveSuccess && (
              <span className="badge badge-safe text-xs font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> SAVED
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Module 1 (AI Subsidence) Ingestion Webhook:</label>
              <input
                type="text"
                value={settings.module_1_webhook_url}
                onChange={(e) => setSettings({ ...settings, module_1_webhook_url: e.target.value })}
                className="input-control text-cyan-300"
              />
              <span className="text-[10px] text-slate-500">Method: POST /api/alerts/ai</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Module 2 (Smart Bands) Ingestion Webhook:</label>
              <input
                type="text"
                value={settings.module_2_webhook_url}
                onChange={(e) => setSettings({ ...settings, module_2_webhook_url: e.target.value })}
                className="input-control text-purple-300"
              />
              <span className="text-[10px] text-slate-500">Method: POST /api/alerts/miner</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">AI Confidence Gate (%):</label>
                <input
                  type="number"
                  value={settings.ai_confidence_threshold_pct}
                  onChange={(e) => setSettings({ ...settings, ai_confidence_threshold_pct: Number(e.target.value) })}
                  className="input-control"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Telemetry Stream Interval (s):</label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.telemetry_poll_interval_sec}
                  onChange={(e) => setSettings({ ...settings, telemetry_poll_interval_sec: Number(e.target.value) })}
                  className="input-control"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="autoEsc"
                checked={settings.auto_escalate_critical_alerts}
                onChange={(e) => setSettings({ ...settings, auto_escalate_critical_alerts: e.target.checked })}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-0"
              />
              <label htmlFor="autoEsc" className="text-slate-300 cursor-pointer">
                Automatically flag Critical alerts for SAR Escalation
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="btn btn-primary btn-sm text-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Audit Logs Stream */}
      <div className="glass-panel p-5 rounded-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <h3 className="font-display font-bold text-sm text-white tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            SYSTEM AUDIT & SECURITY LOG STREAM
          </h3>
          <span className="text-[11px] font-mono text-slate-400">{auditLogs.length} Events Logged</span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs pr-1">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-2 rounded bg-slate-900/60 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">{log.user_name}:</span>
                <span className="badge badge-purple text-[9px]">{log.action}</span>
                <span className="text-slate-300 text-[11px]">{log.details}</span>
              </div>
              <span className="text-[10px] text-slate-500">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
