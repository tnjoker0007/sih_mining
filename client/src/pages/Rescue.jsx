import React, { useState, useEffect } from 'react';
import { 
  Ambulance, 
  ShieldCheck, 
  Users, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Radio, 
  MessageSquare, 
  Plus, 
  Heart, 
  Activity, 
  MapPin, 
  Send, 
  AlertOctagon, 
  Flame, 
  Check 
} from 'lucide-react';
import { useLiveStream } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../utils/api';
import { audioAlerts } from '../utils/audio';

const WORKFLOW_STEPS = [
  'NEW',
  'ACKNOWLEDGED',
  'RESCUE_TEAM_ASSIGNED',
  'RESCUE_IN_PROGRESS',
  'MINER_SAFE_RESOLVED',
  'CLOSED'
];

export default function Rescue({ onOpenEvacuateModal }) {
  const { incidents, miners, zones, refreshAll } = useLiveStream();
  const { user } = useAuth();

  const [teams, setTeams] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [newUpdateText, setNewUpdateText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApi('/rescue-teams/rescue-teams/list')
      .then(res => res.data && setTeams(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedIncident && incidents.length > 0) {
      setSelectedIncident(incidents[0]);
    } else if (selectedIncident) {
      const refreshed = incidents.find(i => i.id === selectedIncident.id);
      if (refreshed) setSelectedIncident(refreshed);
    }
  }, [incidents]);

  const activeInc = selectedIncident || (incidents.length > 0 ? incidents[0] : null);

  const handleAdvanceWorkflow = async (nextStatus) => {
    if (!activeInc) return;
    setLoading(true);
    try {
      await fetchApi(`/incidents/${activeInc.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: nextStatus,
          assigned_team_id: activeInc.assigned_team_id || 'RESCUE_01',
          user_name: user?.full_name || 'SAR Commander',
          role: user?.role || 'Rescue Team',
          notes: `Operational state advanced to ${nextStatus}.`,
          action_taken: `SAR protocol status updated.`
        })
      });

      if (nextStatus === 'MINER_SAFE_RESOLVED') {
        audioAlerts.playSuccess();
      } else {
        audioAlerts.playAckBeep();
      }

      await refreshAll();
      const updatedTeams = await fetchApi('/rescue-teams/rescue-teams/list');
      if (updatedTeams.data) setTeams(updatedTeams.data);
    } catch (e) {
      window.alert('Error advancing workflow: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUpdateLog = async (e) => {
    e.preventDefault();
    if (!newUpdateText.trim() || !activeInc) return;
    try {
      await fetchApi(`/incidents/${activeInc.id}/updates`, {
        method: 'POST',
        body: JSON.stringify({
          user_name: user?.full_name || 'SAR Officer',
          role: user?.role || 'Rescue Team',
          notes: newUpdateText,
          action_taken: 'Radio communication broadcast logged.'
        })
      });
      setNewUpdateText('');
      await refreshAll();
    } catch (e) {
      window.alert('Error adding update: ' + e.message);
    }
  };

  const currentStepIndex = activeInc ? WORKFLOW_STEPS.indexOf(activeInc.status) : 0;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto font-sans text-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-gray-900 border border-gray-700 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/30">
              RESCUE OPERATIONS
            </span>
            <span className="text-xs font-mono text-gray-400">Sections 5 & 6 Workflow</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide mt-1 flex items-center gap-2">
            <Ambulance className="w-5 h-5 text-red-400" />
            Rescue Coordination & Active Incidents
          </h1>
        </div>

        <button
          onClick={onOpenEvacuateModal}
          className="btn-industrial btn-industrial-danger text-xs flex items-center gap-1.5"
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Broadcast Evacuation</span>
        </button>
      </div>

      {/* Incident Cards Selector */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {incidents.map((inc) => {
          const isSelected = activeInc?.id === inc.id;
          return (
            <button
              key={inc.id}
              onClick={() => setSelectedIncident(inc)}
              className={`p-3 rounded-lg border text-left min-w-[260px] transition-all ${
                isSelected
                  ? 'bg-gray-900 border-red-500 shadow-md'
                  : 'bg-gray-900/60 border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-red-400 font-bold">{inc.code}</span>
                <span className="badge-status badge-status-critical text-[9px]">{inc.status.replace(/_/g, ' ')}</span>
              </div>
              <div className="text-xs font-bold text-white line-clamp-1">{inc.title}</div>
              <div className="text-[11px] font-mono text-gray-400 mt-1">
                📍 {inc.zone_name} • {inc.affected_miners_count} Affected
              </div>
            </button>
          );
        })}
      </div>

      {activeInc ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2 Cols: Tactical Workflow Progression & Comm Timeline */}
          <div className="lg:col-span-2 space-y-5">
            {/* 6-Step Workflow State Machine */}
            <div className="industrial-card p-4 space-y-4 border-l-4 border-l-red-500">
              <div className="flex items-center justify-between pb-2 border-b border-gray-700">
                <h2 className="font-bold text-sm text-white tracking-wide uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  Rescue Workflow Lifecycle (Spec 6)
                </h2>
                <span className="badge-status badge-status-critical text-xs">
                  CURRENT: {activeInc.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Stepper */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center font-mono text-[10px]">
                {WORKFLOW_STEPS.map((step, idx) => {
                  const isCompleted = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div
                      key={step}
                      className={`p-2 rounded border transition-all ${
                        isCurrent
                          ? 'bg-red-950 border-red-500 text-red-200 font-bold shadow-md animate-pulse'
                          : isCompleted
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                          : 'bg-gray-800 border-gray-700 text-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        {isCompleted ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span>{idx + 1}</span>}
                      </div>
                      <div>{step.replace(/_/g, ' ')}</div>
                    </div>
                  );
                })}
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-700">
                <div className="text-xs font-mono text-gray-400">
                  Squad Unit: <strong className="text-blue-400">{activeInc.assigned_team_name || 'Pending Deployment'}</strong>
                </div>

                <div className="flex items-center gap-2">
                  {currentStepIndex < WORKFLOW_STEPS.length - 1 && (
                    <button
                      onClick={() => handleAdvanceWorkflow(WORKFLOW_STEPS[currentStepIndex + 1])}
                      disabled={loading}
                      className="btn-industrial btn-industrial-primary text-xs flex items-center gap-1.5"
                    >
                      <span>Advance to {WORKFLOW_STEPS[currentStepIndex + 1].replace(/_/g, ' ')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {activeInc.status === 'MINER_SAFE_RESOLVED' && (
                    <button
                      onClick={() => handleAdvanceWorkflow('CLOSED')}
                      disabled={loading}
                      className="btn-industrial btn-industrial-primary text-xs"
                    >
                      Close Incident & Archive
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Affected Miners */}
            <div className="industrial-card p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-700">
                <h3 className="font-bold text-sm text-white uppercase tracking-wide flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Affected Personnel ({activeInc.affected_miners_count})
                </h3>
                <span className="text-xs font-mono text-gray-400">Module 2 Smart Band Live Vitals</span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {miners
                  .filter(m => activeInc.affected_miners?.includes(m.id) || m.zone_id === activeInc.zone_id)
                  .map((miner) => {
                    const isCrit = miner.status === 'FALL_DETECTED' || miner.status === 'SOS';

                    return (
                      <div
                        key={miner.id}
                        className={`p-3 rounded border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isCrit ? 'bg-red-950/40 border-red-500/60' : 'bg-gray-800/60 border-gray-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm font-sans">{miner.name}</span>
                            <span className={`badge-status ${isCrit ? 'badge-status-critical' : 'badge-status-safe'}`}>
                              {miner.status}
                            </span>
                            <span className="text-gray-400 text-[11px]">BAND: {miner.assigned_band_id}</span>
                          </div>
                          <div className="text-gray-400 text-[11px] mt-0.5">
                            {miner.role_title} • Blood: {miner.blood_group} • Contact: {miner.emergency_contact}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-center">
                            <div className="text-[10px] text-gray-400 flex items-center gap-1 justify-center">
                              <Heart className="w-3 h-3 text-red-400" /> HR
                            </div>
                            <div className={`font-bold ${isCrit ? 'text-red-400' : 'text-gray-100'}`}>
                              {miner.vitals?.heart_rate || '--'} bpm
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-gray-400 flex items-center gap-1 justify-center">
                              <Activity className="w-3 h-3 text-blue-400" /> SpO2
                            </div>
                            <div className="font-bold text-gray-100">{miner.vitals?.spo2 || '--'}%</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Radio Timeline Log */}
            <div className="industrial-card p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-gray-700">
                <h3 className="font-bold text-sm text-white uppercase tracking-wide flex items-center gap-2">
                  <Radio className="w-4 h-4 text-blue-400" />
                  Incident Timeline & Radio Communications
                </h3>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {activeInc.timeline?.map((entry) => (
                  <div key={entry.id} className="p-2.5 rounded bg-gray-800 border border-gray-700 space-y-0.5">
                    <div className="flex items-center justify-between text-gray-400 text-[11px]">
                      <div>
                        <span className="font-bold text-blue-400">{entry.user_name}</span> • <span className="text-purple-300">{entry.role}</span>
                      </div>
                      <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-gray-200">{entry.notes}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddUpdateLog} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Transmit radio log or operational update..."
                  value={newUpdateText}
                  onChange={(e) => setNewUpdateText(e.target.value)}
                  className="input-industrial text-xs"
                />
                <button type="submit" className="btn-industrial btn-industrial-primary text-xs flex-shrink-0">
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right 1 Col: Rescue Squads Roster */}
          <div className="industrial-card p-4 space-y-3 font-mono text-xs">
            <h3 className="font-bold text-sm text-white uppercase tracking-wide border-b border-gray-700 pb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Rescue Teams Squad Directory
            </h3>

            <div className="space-y-3">
              {teams.map((team) => {
                const isDispatched = team.status === 'DISPATCHED' || team.status === 'ON_SCENE';

                return (
                  <div
                    key={team.id}
                    className={`p-3 rounded border space-y-1.5 ${
                      isDispatched ? 'bg-red-950/30 border-red-500/60' : 'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white font-sans text-xs">{team.name}</div>
                      <span className={`badge-status ${isDispatched ? 'badge-status-critical' : 'badge-status-safe'}`}>
                        {team.status}
                      </span>
                    </div>
                    <div className="text-gray-400 text-[11px]">Lead: {team.lead_user_name} ({team.team_size} operatives)</div>
                    <div className="text-blue-300 text-[11px] font-semibold">{team.specialization}</div>
                    {team.equipment && (
                      <div className="pt-1 text-[10px] text-gray-400">
                        Equipment: {team.equipment.slice(0, 2).join(', ')}...
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="industrial-card p-12 text-center text-gray-400 font-mono text-xs">
          No rescue incidents active.
        </div>
      )}
    </div>
  );
}
