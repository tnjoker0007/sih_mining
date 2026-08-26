import React, { useState } from 'react';
import { X, Heart, Activity, User, Radio, CheckCircle, Flame } from 'lucide-react';
import { fetchApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLiveStream } from '../context/WebSocketContext';

export default function MinerModal({ miner, onClose }) {
  const { user } = useAuth();
  const { refreshAll } = useLiveStream();
  const [sendingHaptic, setSendingHaptic] = useState(false);
  const [pingSent, setPingSent] = useState(false);

  if (!miner) return null;

  const isSOS = miner.status === 'SOS';
  const isFall = miner.status === 'FALL_DETECTED';

  const handleDirectBandAlert = async () => {
    setSendingHaptic(true);
    try {
      await fetchApi('/bands/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          target_type: 'SPECIFIC_BANDS',
          target_id: [miner.assigned_band_id],
          alert_level: 'EMERGENCY_EVACUATE',
          message: `DIRECTIVE TO ${miner.name}: EVACUATE TO NEAREST HARDENED REFUGE BAY IMMEDIATELY.`,
          sender_name: user?.full_name || 'Control Room'
        })
      });
      setPingSent(true);
      setTimeout(() => setPingSent(false), 3000);
      await refreshAll();
    } catch (e) {
      window.alert('Error transmitting to band: ' + e.message);
    } finally {
      setSendingHaptic(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className={`industrial-card w-full max-w-lg p-5 rounded-lg text-gray-100 shadow-2xl space-y-4 ${
        isSOS || isFall ? 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.3)]' : ''
      }`}>
        <div className="flex items-center justify-between border-b border-gray-700 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-800 text-white font-bold">
              {miner.code}
            </span>
            <span className={`badge-status ${
              isSOS || isFall ? 'badge-status-critical' : 'badge-status-safe'
            }`}>
              {miner.status}
            </span>
            <span className="text-xs text-gray-400 font-mono">BAND: {miner.assigned_band_id}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h2 className="text-base font-bold text-white font-sans">{miner.name}</h2>
          <div className="text-xs text-gray-400 font-mono mt-0.5">{miner.role_title} • Blood Type: {miner.blood_group}</div>
        </div>

        {/* Vitals */}
        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          <div className="p-2.5 rounded bg-gray-800">
            <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
              <Heart className="w-3 h-3 text-red-400" /> Heart Rate
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {miner.vitals?.heart_rate || '--'} <span className="text-[10px] text-gray-400">bpm</span>
            </div>
          </div>

          <div className="p-2.5 rounded bg-gray-800">
            <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
              <Activity className="w-3 h-3 text-blue-400" /> SpO2
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {miner.vitals?.spo2 || '--'}%
            </div>
          </div>

          <div className="p-2.5 rounded bg-gray-800">
            <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" /> Temp
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {miner.vitals?.skin_temp_c || '--'}°C
            </div>
          </div>
        </div>

        <div className="p-3 rounded bg-gray-800 text-xs font-mono space-y-1 text-gray-300">
          <div className="flex justify-between">
            <span className="text-gray-400">Current Location:</span>
            <strong className="text-white">{miner.zone_name}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Motion State:</span>
            <span className={isFall ? 'text-red-400 font-bold' : 'text-emerald-400'}>{miner.vitals?.motion_state || 'STABLE'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Impact Force:</span>
            <span>{miner.vitals?.impact_g || '0.0'} G</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Emergency Contact:</span>
            <span>{miner.emergency_contact}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-700">
          <span className="text-[11px] font-mono text-gray-400">
            {pingSent ? '✓ Signal Transmitted' : 'Radio Downlink Ready'}
          </span>
          <button
            onClick={handleDirectBandAlert}
            disabled={sendingHaptic}
            className="btn-industrial btn-industrial-danger text-xs flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{sendingHaptic ? 'Transmitting...' : 'Send Haptic / Siren'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
