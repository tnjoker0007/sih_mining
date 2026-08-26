import React from 'react';
import { X, Cpu, Battery, Signal } from 'lucide-react';

export default function NodeModal({ node, onClose }) {
  if (!node) return null;

  const isCritical = node.status === 'CRITICAL';
  const isWarning = node.status === 'WARNING';

  return (
    <div className="modal-backdrop">
      <div className="industrial-card w-full max-w-lg p-5 rounded-lg text-gray-100 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-700 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-800 text-white font-bold">
              {node.code}
            </span>
            <span className={`badge-status ${
              isCritical ? 'badge-status-critical' : isWarning ? 'badge-status-warning' : 'badge-status-safe'
            }`}>
              {node.status}
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
          <h2 className="text-base font-bold text-white font-sans">{node.name}</h2>
          <div className="text-xs text-gray-400 font-mono mt-0.5">{node.zone_name} • {node.type}</div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded bg-gray-800 flex justify-between">
            <span className="text-gray-400">Battery:</span>
            <strong className="text-emerald-400">{node.battery_pct}%</strong>
          </div>
          <div className="p-2.5 rounded bg-gray-800 flex justify-between">
            <span className="text-gray-400">Signal:</span>
            <strong className="text-white">{node.signal_dbm} dBm</strong>
          </div>
        </div>

        <div className="p-3 rounded bg-gray-950 border border-gray-800 font-mono text-xs space-y-1">
          <div className="text-[10px] text-gray-400 uppercase">Live Sensor Telemetry:</div>
          <pre className="text-blue-300 text-[11px] overflow-x-auto">
            {JSON.stringify(node.last_reading, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
