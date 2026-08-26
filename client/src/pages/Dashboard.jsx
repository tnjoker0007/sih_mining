import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Ambulance, 
  Users, 
  Activity, 
  Layers, 
  Radio, 
  Clock, 
  ArrowRight, 
  Heart, 
  Flame, 
  Maximize2,
  ChevronRight,
  Send,
  Building2,
  Cpu
} from 'lucide-react';
import { useLiveStream } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../utils/api';
import AlertDetailModal from '../components/AlertDetailModal';
import MinerModal from '../components/MinerModal';
import NodeModal from '../components/NodeModal';

export default function Dashboard({ setActiveTab, onOpenEvacuateModal }) {
  const { kpis, alerts, miners, nodes, zones, incidents, refreshAll } = useLiveStream();
  const { user } = useAuth();

  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedMiner, setSelectedMiner] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // Counts for the 5 Top KPI cards as specified in doc:
  // [Safe Zones] [Warning Zones] [Critical Zones] [Active Alerts] [Open Incidents]
  const safeZonesCount = zones.filter(z => z.risk_level === 'SAFE').length;
  const warningZonesCount = zones.filter(z => z.risk_level === 'WARNING').length;
  const criticalZonesCount = zones.filter(z => z.risk_level === 'CRITICAL').length;
  const activeAlertsCount = alerts.filter(a => a.status === 'NEW' || a.status === 'ACKNOWLEDGED').length;
  const openIncidentsCount = incidents.filter(i => i.status !== 'CLOSED').length;

  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED');
  const activeSOSMiners = miners.filter(m => m.status === 'SOS' || m.status === 'FALL_DETECTED');
  const activeInc = incidents.find(i => i.status !== 'CLOSED') || (incidents.length > 0 ? incidents[0] : null);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1600px] mx-auto text-gray-100 font-sans">
      {/* =========================================================================
          ROW 1: TOP KPI CARDS (Spec: Safe, Warning, Critical, Active Alerts, Open Incidents)
          ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Safe Zones (Green) */}
        <div 
          onClick={() => setActiveTab('zones')}
          className="industrial-card p-3.5 cursor-pointer hover:border-emerald-500 transition-all border-l-4 border-l-emerald-500"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>SAFE ZONES</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1.5">
            {safeZonesCount} <span className="text-xs font-normal text-gray-400">/ {zones.length}</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Nominal Strata</span>
          </div>
        </div>

        {/* KPI 2: Warning Zones (Amber) */}
        <div 
          onClick={() => setActiveTab('zones')}
          className="industrial-card p-3.5 cursor-pointer hover:border-amber-500 transition-all border-l-4 border-l-amber-500"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>WARNING ZONES</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1.5">
            {warningZonesCount}
          </div>
          <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Elevated Creep</span>
          </div>
        </div>

        {/* KPI 3: Critical Zones (Red) */}
        <div 
          onClick={() => setActiveTab('zones')}
          className={`industrial-card p-3.5 cursor-pointer hover:border-red-500 transition-all border-l-4 border-l-red-500 ${
            criticalZonesCount > 0 ? 'bg-red-950/30' : ''
          }`}
        >
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>CRITICAL ZONES</span>
            <AlertOctagon className={`w-4 h-4 ${criticalZonesCount > 0 ? 'text-red-400 animate-pulse' : 'text-gray-400'}`} />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400 mt-1.5">
            {criticalZonesCount}
          </div>
          <div className="text-[11px] text-red-300 mt-1 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${criticalZonesCount > 0 ? 'bg-red-500 animate-ping' : 'bg-gray-500'}`}></span>
            <span>{criticalZonesCount > 0 ? 'Immediate Action' : 'None Active'}</span>
          </div>
        </div>

        {/* KPI 4: Active Alerts (Amber/Red) */}
        <div 
          onClick={() => setActiveTab('alerts')}
          className="industrial-card p-3.5 cursor-pointer hover:border-blue-500 transition-all border-l-4 border-l-blue-500"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>ACTIVE ALERTS</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">
            {activeAlertsCount}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            <span className="text-red-400 font-semibold">{criticalAlerts.length} Critical</span> • <span className="text-amber-400">{activeAlertsCount - criticalAlerts.length} Warning</span>
          </div>
        </div>

        {/* KPI 5: Open Incidents (Red) */}
        <div 
          onClick={() => setActiveTab('rescue')}
          className="industrial-card p-3.5 cursor-pointer hover:border-red-500 transition-all border-l-4 border-l-red-500"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>OPEN INCIDENTS</span>
            <Ambulance className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400 mt-1.5">
            {openIncidentsCount}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            <span>SAR Units Deployed: {openIncidentsCount > 0 ? '1 Active' : '0'}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: MAIN AREA (Spec: Large Interactive Digital Mine Map + Critical Alert/Incident Panel)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Interactive Digital Mine Map (2D) */}
        <div className="lg:col-span-2 industrial-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-gray-700 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                Digital Mine Map (Real-Time Situational Plan)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-400">Mine: MINE_001</span>
              <button
                onClick={() => setActiveTab('map')}
                className="btn-industrial btn-industrial-outline text-xs px-2.5 py-1"
              >
                Full Screen Map <Maximize2 className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative w-full h-[360px] bg-gray-950 rounded border border-gray-800 overflow-hidden">
            <svg viewBox="0 0 850 480" className="w-full h-full">
              <defs>
                <pattern id="dashGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="850" height="480" fill="url(#dashGrid)" />

              {/* Mine Shaft & Gallery Network */}
              <g opacity="0.9">
                {/* Main Shaft 1 */}
                <line x1="220" y1="30" x2="220" y2="440" stroke="#374151" strokeWidth="20" strokeLinecap="round" />
                <line x1="220" y1="30" x2="220" y2="440" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 4" />

                {/* Shaft 2 */}
                <line x1="520" y1="50" x2="520" y2="420" stroke="#374151" strokeWidth="18" strokeLinecap="round" />
                <line x1="520" y1="50" x2="520" y2="420" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 4" />

                {/* Galleries */}
                <line x1="100" y1="130" x2="380" y2="130" stroke="#374151" strokeWidth="16" strokeLinecap="round" />
                <line x1="380" y1="130" x2="480" y2="160" stroke="#374151" strokeWidth="16" strokeLinecap="round" />
                <line x1="480" y1="160" x2="680" y2="160" stroke="#374151" strokeWidth="16" strokeLinecap="round" />

                {/* Mid Gallery (Refuge Chamber connection) */}
                <line x1="220" y1="230" x2="520" y2="230" stroke="#374151" strokeWidth="18" strokeLinecap="round" />

                {/* Lower Gallery */}
                <line x1="90" y1="320" x2="360" y2="320" stroke="#374151" strokeWidth="16" strokeLinecap="round" />
                <line x1="360" y1="320" x2="520" y2="340" stroke="#374151" strokeWidth="16" strokeLinecap="round" />
                <line x1="520" y1="340" x2="700" y2="340" stroke="#374151" strokeWidth="16" strokeLinecap="round" />
              </g>

              {/* Zones */}
              {zones.map((zone) => {
                const coords = zone.coordinates || { x: 200, y: 200, width: 180, height: 90 };
                const isCrit = zone.risk_level === 'CRITICAL';
                const isWarn = zone.risk_level === 'WARNING';
                const isSafe = zone.risk_level === 'SAFE';

                const strokeColor = isCrit ? '#ef4444' : isWarn ? '#f59e0b' : '#10b981';
                const fillColor = isCrit ? 'rgba(239, 68, 68, 0.18)' : isWarn ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.08)';

                return (
                  <g key={zone.id} className="cursor-pointer" onClick={() => setActiveTab('zones')}>
                    <rect
                      x={coords.x}
                      y={coords.y}
                      width={coords.width}
                      height={coords.height}
                      rx="6"
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isCrit ? '2.5' : '1.5'}
                      strokeDasharray={isCrit ? 'none' : '4 2'}
                      className={isCrit ? 'animate-pulse' : ''}
                    />
                    <text
                      x={coords.x + 8}
                      y={coords.y + 18}
                      fill={strokeColor}
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                      fontWeight="bold"
                    >
                      {zone.code} ({zone.risk_level})
                    </text>
                    <text
                      x={coords.x + 8}
                      y={coords.y + 32}
                      fill="#e5e7eb"
                      fontSize="9.5"
                      fontWeight="600"
                    >
                      {zone.name}
                    </text>
                  </g>
                );
              })}

              {/* Sensor Nodes (Module 1) */}
              {nodes.map((node) => {
                const isCrit = node.status === 'CRITICAL';
                const coords = node.coordinates || { x: 300, y: 250 };
                const color = isCrit ? '#ef4444' : node.status === 'WARNING' ? '#f59e0b' : '#3b82f6';

                return (
                  <g
                    key={node.id}
                    transform={`translate(${coords.x}, ${coords.y})`}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer"
                  >
                    {isCrit && (
                      <circle cx="0" cy="0" r="14" fill="none" stroke="#ef4444" strokeWidth="1.5">
                        <animate attributeName="r" values="6;20" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <rect x="-6" y="-6" width="12" height="12" rx="2" fill="#111827" stroke={color} strokeWidth="2" />
                    <text x="0" y="-10" fill="#d1d5db" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">
                      {node.code}
                    </text>
                  </g>
                );
              })}

              {/* Miners (Module 2 Smart Bands) */}
              {miners.map((miner) => {
                const isSOS = miner.status === 'SOS';
                const isFall = miner.status === 'FALL_DETECTED';
                const coords = miner.coordinates || { x: 200, y: 200 };
                const color = (isSOS || isFall) ? '#ef4444' : '#10b981';

                return (
                  <g
                    key={miner.id}
                    transform={`translate(${coords.x}, ${coords.y})`}
                    onClick={() => setSelectedMiner(miner)}
                    className="cursor-pointer"
                  >
                    {(isSOS || isFall) && (
                      <circle cx="0" cy="0" r="18" fill="none" stroke="#ef4444" strokeWidth="2">
                        <animate attributeName="r" values="6;26" dur="1.2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0" dur="1.2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle cx="0" cy="0" r="7" fill="#111827" stroke={color} strokeWidth="2" />
                    <circle cx="0" cy="0" r="3" fill={color} />
                    <text x="0" y="16" fill="#ffffff" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                      {miner.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Map Legend Bar */}
            <div className="absolute bottom-2 left-2 bg-gray-900/90 px-3 py-1.5 rounded border border-gray-700 text-[11px] font-mono flex items-center gap-4">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> SAFE
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> WARNING
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-400"></span> CRITICAL (Pulsing)
              </span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Critical Alerts / Incidents Panel (Pinned until acknowledged) */}
        <div className="industrial-card p-4 flex flex-col justify-between space-y-3 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between pb-2 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Critical Alerts & Incidents
              </h3>
            </div>
            <span className="badge-status badge-status-critical">
              {criticalAlerts.length} Pinned
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[310px] pr-1 font-mono text-xs">
            {criticalAlerts.length > 0 ? (
              criticalAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className="p-3 rounded bg-red-950/40 border border-red-500/50 hover:border-red-400 cursor-pointer space-y-1.5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-red-300">{alert.id}</span>
                      <span className="badge-status badge-status-critical text-[10px]">
                        {alert.severity}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="font-semibold text-white font-sans text-xs">
                    {alert.title}
                  </div>

                  <div className="text-[11px] text-gray-300 line-clamp-2">
                    {alert.description}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-red-900/50">
                    <span>📍 {alert.zone_name}</span>
                    <span className="text-blue-400 underline">Inspect & Escalate →</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div>All critical alerts acknowledged & stabilized.</div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-gray-700 flex justify-between items-center text-xs">
            <button
              onClick={() => setActiveTab('alerts')}
              className="text-blue-400 hover:underline font-mono"
            >
              View Full Alert Feed ({alerts.length}) →
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 3: SECOND ROW (Spec: Zone Risk Summary + Active SOS/Miner Summary)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Zone Risk Summary */}
        <div className="industrial-card p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Zone Risk Summary
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('zones')}
              className="text-xs text-blue-400 hover:underline font-mono"
            >
              Zone Hub →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800 text-[11px]">
                  <th className="pb-2">Zone</th>
                  <th className="pb-2">Depth</th>
                  <th className="pb-2">Risk Level</th>
                  <th className="pb-2">Subsidence Rate</th>
                  <th className="pb-2">Gas (CH4)</th>
                  <th className="pb-2 text-right">Occupancy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {zones.map((zone) => {
                  const isCrit = zone.risk_level === 'CRITICAL';
                  const isWarn = zone.risk_level === 'WARNING';

                  return (
                    <tr key={zone.id} className="hover:bg-gray-800/40">
                      <td className="py-2 font-bold text-white">{zone.code} - {zone.name}</td>
                      <td className="py-2 text-gray-300">{zone.level_depth_m}m</td>
                      <td className="py-2">
                        <span className={`badge-status ${
                          isCrit ? 'badge-status-critical' : isWarn ? 'badge-status-warning' : 'badge-status-safe'
                        }`}>
                          {zone.risk_level}
                        </span>
                      </td>
                      <td className={`py-2 ${isCrit ? 'text-red-400 font-bold' : 'text-gray-300'}`}>
                        {zone.subsidence_velocity_mm_hr} mm/hr
                      </td>
                      <td className="py-2 text-gray-300">{zone.gas_ch4_ppm}%</td>
                      <td className="py-2 text-right font-bold text-blue-400">
                        {zone.current_occupancy || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active SOS & Miner Summary */}
        <div className="industrial-card p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Active SOS & Miner Safety Summary (Module 2)
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('users')}
              className="text-xs text-blue-400 hover:underline font-mono"
            >
              All Miners ({miners.length}) →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
            {miners.map((m) => {
              const isSOS = m.status === 'SOS';
              const isFall = m.status === 'FALL_DETECTED';

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMiner(m)}
                  className={`p-2.5 rounded border cursor-pointer transition-all ${
                    isSOS || isFall
                      ? 'bg-red-950/50 border-red-500 text-red-200 animate-pulse'
                      : 'bg-gray-800/60 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-sans">{m.name}</span>
                    <span className={`badge-status ${
                      isSOS || isFall ? 'badge-status-critical' : 'badge-status-safe'
                    } text-[9px]`}>
                      {m.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                    <span>{m.zone_name.split('-')[0]}</span>
                    <span>HR: <strong className={isSOS || isFall ? 'text-red-400' : 'text-emerald-400'}>{m.vitals?.heart_rate || '--'}</strong> bpm</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 4: BOTTOM AREA (Spec: Rescue Progress Timeline + Recent Activity Feed)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Rescue Progress Timeline */}
        <div className="industrial-card p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Ambulance className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Rescue Progress Timeline (Active SAR)
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('rescue')}
              className="text-xs text-blue-400 hover:underline font-mono"
            >
              Rescue Hub →
            </button>
          </div>

          {activeInc ? (
            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between bg-gray-800/70 p-2.5 rounded border border-gray-700">
                <div>
                  <span className="font-bold text-red-400">{activeInc.code}:</span> {activeInc.title}
                </div>
                <span className="badge-status badge-status-critical text-[10px]">
                  {activeInc.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Timeline Steps */}
              <div className="space-y-1.5 pl-2 border-l-2 border-blue-600 max-h-36 overflow-y-auto">
                {activeInc.timeline?.map((t) => (
                  <div key={t.id} className="text-[11px] space-y-0.5">
                    <div className="text-gray-400">
                      <span className="text-blue-400 font-bold">{t.user_name}</span> • {new Date(t.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-gray-200">{t.notes}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400 font-mono text-xs">
              No active rescue incidents currently open.
            </div>
          )}
        </div>

        {/* Recent Alerts Feed */}
        <div className="industrial-card p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Recent Activity & Alert Stream
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('alerts')}
              className="text-xs text-blue-400 hover:underline font-mono"
            >
              Alert Engine →
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-xs pr-1">
            {alerts.slice(0, 4).map((a) => (
              <div
                key={a.id}
                onClick={() => setSelectedAlert(a)}
                className="p-2 rounded bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{a.id}</span>
                    <span className={`badge-status ${
                      a.severity === 'CRITICAL' ? 'badge-status-critical' : a.severity === 'WARNING' ? 'badge-status-warning' : 'badge-status-info'
                    } text-[9px]`}>
                      {a.severity}
                    </span>
                    <span className="text-gray-400 text-[10px]">{a.source.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-gray-300 font-sans text-xs line-clamp-1">{a.title}</div>
                </div>
                <div className="text-[10px] text-gray-500 flex-shrink-0">
                  {new Date(a.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Modals */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onEscalateSuccess={() => setActiveTab('rescue')}
        />
      )}

      {selectedMiner && (
        <MinerModal
          miner={selectedMiner}
          onClose={() => setSelectedMiner(null)}
        />
      )}

      {selectedNode && (
        <NodeModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
