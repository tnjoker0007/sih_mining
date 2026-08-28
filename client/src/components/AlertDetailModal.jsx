import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Ambulance, 
  Cpu, 
  MapPin, 
  ShieldCheck
} from 'lucide-react';
import { fetchApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLiveStream } from '../context/WebSocketContext';
import { audioAlerts } from '../utils/audio';

export default function AlertDetailModal({ alert, onClose, onEscalateSuccess }) {
  const { user } = useAuth();
  const { refreshAll } = useLiveStream();
  const [loading, setLoading] = useState(false);
  const [escalating, setEscalating] = useState(false);

  if (!alert) return null;

  const isCritical = alert.severity === 'CRITICAL';
  const isWarning = alert.severity === 'WARNING';

  const handleAcknowledge = async () => {
    setLoading(true);
    try {
      await fetchApi(`/alerts/${alert.id}/acknowledge`, {
        method: 'PUT',
        body: JSON.stringify({
          user_name: user?.full_name || 'Control Room Operator',
          notes: 'Operator verified telemetry on live map.'
        })
      });
      audioAlerts.playAckBeep();
      await refreshAll();
      onClose();
    } catch (e) {
      window.alert('Error acknowledging alert: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalateToIncident = async () => {
    setEscalating(true);
    try {
      const res = await fetchApi('/incidents', {
        method: 'POST',
        body: JSON.stringify({
          alert_id: alert.id,
          title: `SAR Incident: ${alert.title}`,
          zone_id: alert.zone_id,
          severity: alert.severity,
          assigned_team_id: 'RESCUE_01',
          affected_miners: alert.miner_id ? [alert.miner_id] : [],
          incident_lead: 'Capt. Gabriel Reyes',
          user_name: user?.full_name || 'Command',
          notes: `Escalated directly from central alert ${alert.id} (${alert.source}).`
        })
      });

      audioAlerts.playCriticalAlert();
      await refreshAll();
      if (onEscalateSuccess) onEscalateSuccess(res.data);
      onClose();
    } catch (e) {
      window.alert('Error escalating incident: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    setLoading(true);
    try {
      await fetchApi(`/alerts/${alert.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'RESOLVED',
          user_name: user?.full_name || 'Chief Inspector',
          notes: 'Manual resolution verified by safety officer.'
        })
      });
      audioAlerts.playSuccess();
      await refreshAll();
      onClose();
    } catch (e) {
      window.alert('Error resolving alert: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="industrial-card w-full max-w-xl p-5 rounded-lg text-gray-100 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-800 text-white font-bold">
              {alert.id}
            </span>
            <span className={`badge-status ${
              isCritical ? 'badge-status-critical' : isWarning ? 'badge-status-warning' : 'badge-status-info'
            }`}>
              {alert.severity}
            </span>
            <span className="badge-status badge-status-info text-[10px]">
              {alert.source.replace(/_/g, ' ')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h2 className="text-base font-bold text-white font-sans">
            {alert.title}
          </h2>
          <p className="text-xs text-gray-300 font-mono mt-1 leading-relaxed">
            {alert.description}
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded bg-gray-800 space-y-1">
            <div className="text-gray-400 text-[10px] uppercase">Zone Location:</div>
            <div className="font-semibold text-white">{alert.zone_name} ({alert.zone_id})</div>
            {alert.miner_name && <div className="text-amber-300">Miner: {alert.miner_name}</div>}
          </div>

          <div className="p-3 rounded bg-gray-800 space-y-1">
            <div className="text-gray-400 text-[10px] uppercase">Telemetry / AI Conf:</div>
            <div className="font-semibold text-blue-300">{alert.ai_confidence ? `${alert.ai_confidence}% Model Confidence` : 'Sensor Stream'}</div>
            <div className="text-gray-400 text-[10px]">{new Date(alert.created_at).toLocaleString()}</div>
          </div>
        </div>

        {/* JSON Payload */}
        {alert.data_payload && Object.keys(alert.data_payload).length > 0 && (
          <div className="p-2.5 rounded bg-gray-950 border border-gray-800 font-mono text-[11px] space-y-1">
            <div className="text-[10px] text-gray-400 uppercase">Normalized Ingestion Telemetry:</div>
            <pre className="text-blue-300 overflow-x-auto">
              {JSON.stringify(alert.data_payload, null, 2)}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-700 font-mono text-xs">
          <div className="text-gray-400">
            Status: <span className="font-bold text-white">{alert.status}</span>
          </div>

          <div className="flex items-center gap-2">
            {alert.status === 'NEW' && (
              <button
                onClick={handleAcknowledge}
                disabled={loading}
                className="btn-industrial btn-industrial-outline text-xs flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{loading ? 'Acknowledging...' : 'Acknowledge'}</span>
              </button>
            )}

            {alert.status !== 'RESOLVED' && (
              <button
                onClick={handleResolve}
                disabled={loading}
                className="btn-industrial btn-industrial-outline text-xs flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resolve</span>
              </button>
            )}

            <button
              onClick={handleEscalateToIncident}
              disabled={escalating}
              className="btn-industrial btn-industrial-danger text-xs flex items-center gap-1.5"
            >
              <Ambulance className="w-3.5 h-3.5" />
              <span>{escalating ? 'Escalating...' : '1-Click Escalate to Rescue'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
