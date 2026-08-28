import React, { useState } from 'react';
import { AlertOctagon, Radio, Send, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { fetchApi } from '../utils/api';
import { useLiveStream } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';

export default function EvacuationModal({ isOpen, onClose }) {
  const { zones, miners } = useLiveStream();
  const { user } = useAuth();

  const [targetType, setTargetType] = useState('ALL');
  const [targetId, setTargetId] = useState('ALL_ZONES');
  const [alertLevel, setAlertLevel] = useState('EMERGENCY_EVACUATE');
  const [message, setMessage] = useState('CRITICAL EVACUATION DIRECTIVE: IMMINENT ROOF INSTABILITY DETECTED. CEASE OPERATIONS AND EVACUATE TO REFUGE CHAMBERS IMMEDIATELY.');
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  if (!isOpen) return null;

  const presets = [
    {
      level: 'EMERGENCY_EVACUATE',
      text: 'CRITICAL EVACUATION DIRECTIVE: IMMINENT ROOF INSTABILITY DETECTED. CEASE OPERATIONS AND EVACUATE TO REFUGE CHAMBERS IMMEDIATELY.'
    },
    {
      level: 'EMERGENCY_EVACUATE',
      text: 'TOXIC GAS ALARM: HIGH METHANE/CO LEVELS DETECTED. DON SELF-RESCUER OXYGEN PACKS AND PROCEED TO SHAFT 1 INCLINE.'
    },
    {
      level: 'WARNING_STANDBY',
      text: 'SAFETY STANDBY: SEISMIC ACTIVITY DETECTED IN LOWER STRATA. RETREAT TO DESIGNATED HARDENED PILLAR BAYS.'
    },
    {
      level: 'ALL_CLEAR',
      text: 'ALL CLEAR: GEOTECHNICAL INSPECTION COMPLETE. VENTILATION NOMINAL. RESUME STANDARD WORK PROTOCOLS.'
    }
  ];

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchApi('/bands/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetType === 'ZONE' ? targetId : 'ALL_ZONES',
          alert_level: alertLevel,
          message,
          sender_name: `${user?.full_name} (${user?.role || 'Command'})`
        })
      });

      if (res.success) {
        setSuccessResult(res.message);
        setTimeout(() => {
          setSuccessResult(null);
          onClose();
        }, 2000);
      }
    } catch (err) {
      alert(`Broadcast failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="industrial-card industrial-card-critical w-full max-w-xl p-5 rounded-lg text-gray-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 border-b border-red-500/30 pb-3">
          <div className="p-2 rounded bg-red-600 text-white">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              EMERGENCY SMART BAND BROADCAST
            </h2>
            <p className="text-xs font-mono text-red-300">
              Module 2 Downlink • Direct Haptic & Audio Siren to Underground Bands
            </p>
          </div>
        </div>

        {successResult ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-300">BROADCAST TRANSMITTED</h3>
            <p className="text-xs font-mono text-gray-300">{successResult}</p>
          </div>
        ) : (
          <form onSubmit={handleBroadcast} className="space-y-3.5 text-xs font-mono">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">Target Personnel:</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="select-industrial w-full text-xs"
                >
                  <option value="ALL">ALL UNDERGROUND MINERS ({miners.length} Bands)</option>
                  <option value="ZONE">SPECIFIC MINE ZONE</option>
                </select>
              </div>

              {targetType === 'ZONE' && (
                <div>
                  <label className="block text-gray-400 mb-1">Select Zone:</label>
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="select-industrial w-full text-xs"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.code} - {z.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-gray-400 mb-1">Alert Priority Level:</label>
                <select
                  value={alertLevel}
                  onChange={(e) => setAlertLevel(e.target.value)}
                  className="select-industrial w-full text-xs"
                >
                  <option value="EMERGENCY_EVACUATE">EMERGENCY EVACUATE (Siren + High Vibe)</option>
                  <option value="WARNING_STANDBY">WARNING / STANDBY (Double Chirp)</option>
                  <option value="ALL_CLEAR">ALL CLEAR (Single Chime)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Direct Message Presets:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMessage(p.text);
                      setAlertLevel(p.level);
                    }}
                    className="p-2 text-left rounded bg-gray-900 hover:bg-gray-800 border border-gray-700 text-[11px] text-gray-300 hover:text-white line-clamp-2"
                  >
                    {p.text}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Smart Band Screen Message:</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                required
                className="input-industrial uppercase text-red-200 bg-black/40 border-red-500/40"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-industrial btn-industrial-outline text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-industrial btn-industrial-danger text-xs flex items-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{loading ? 'Transmitting...' : 'Transmit Broadcast Downlink'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
