import React, { useState, useRef } from 'react';
import { 
  MapPin, 
  Cpu, 
  Users, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  AlertTriangle, 
  Activity, 
  Radio, 
  Navigation, 
  Maximize2,
  X,
  Heart,
  Flame,
  Battery,
  Signal,
  CheckCircle2,
  AlertOctagon,
  ShieldCheck
} from 'lucide-react';
import { useLiveStream } from '../context/WebSocketContext';
import { fetchApi } from '../utils/api';

export default function MineMap({ onOpenEvacuateModal }) {
  const { zones, nodes, miners, alerts, incidents, refreshAll } = useLiveStream();

  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [showMiners, setShowMiners] = useState(true);
  const [showNodes, setShowNodes] = useState(true);
  const [showEvacuationRoutes, setShowEvacuationRoutes] = useState(true);
  const [showHazardHeatmap, setShowHazardHeatmap] = useState(true);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Selected object for the Side Detail Panel (Spec Requirement: "Click object to open side detail panel")
  const [selectedObject, setSelectedObject] = useState(null); // { type: 'ZONE' | 'NODE' | 'MINER', data: object }

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoomIn = () => setZoom(prev => Math.min(2.5, prev + 0.2));
  const handleZoomOut = () => setZoom(prev => Math.max(0.6, prev - 0.2));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const filteredZones = selectedLevel === 'ALL'
    ? zones
    : zones.filter(z => z.level_depth_m.toString() === selectedLevel);

  return (
    <div className="h-[calc(100vh-53px)] flex flex-col bg-gray-950 relative overflow-hidden select-none font-sans text-gray-100">
      {/* Top Map Toolbar */}
      <div className="border-b border-gray-700 bg-gray-900 px-4 py-2 flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-400" />
            <h1 className="font-bold text-sm text-white uppercase tracking-wider">
              Digital Mine Map (2D Vector Plan)
            </h1>
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-gray-300">
            <span className="text-gray-400">Level:</span>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="select-industrial py-0.5 px-2 text-xs"
            >
              <option value="ALL">All Levels (0m - 680m)</option>
              <option value="180">Shaft 1 (180m)</option>
              <option value="350">Sub-level (350m)</option>
              <option value="480">Refuge Bays (480m)</option>
              <option value="520">Shaft 2 (520m)</option>
              <option value="640">Sector 4 (640m)</option>
            </select>
          </div>
        </div>

        {/* Layer Toggles & Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <button
            onClick={() => setShowMiners(!showMiners)}
            className={`px-2 py-1 rounded border transition-colors flex items-center gap-1.5 ${
              showMiners ? 'bg-blue-900/40 border-blue-500 text-blue-300' : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Miners ({miners.length})</span>
          </button>

          <button
            onClick={() => setShowNodes(!showNodes)}
            className={`px-2 py-1 rounded border transition-colors flex items-center gap-1.5 ${
              showNodes ? 'bg-blue-900/40 border-blue-500 text-blue-300' : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Sensors ({nodes.length})</span>
          </button>

          <button
            onClick={() => setShowEvacuationRoutes(!showEvacuationRoutes)}
            className={`px-2 py-1 rounded border transition-colors flex items-center gap-1.5 ${
              showEvacuationRoutes ? 'bg-emerald-900/40 border-emerald-500 text-emerald-300' : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Evacuation Routes</span>
          </button>

          <button
            onClick={() => setShowHazardHeatmap(!showHazardHeatmap)}
            className={`px-2 py-1 rounded border transition-colors flex items-center gap-1.5 ${
              showHazardHeatmap ? 'bg-red-900/40 border-red-500 text-red-300' : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Risk Heatmap</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded p-0.5 ml-2">
            <button onClick={handleZoomIn} title="Zoom In" className="p-1 text-gray-400 hover:text-white">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleZoomOut} title="Zoom Out" className="p-1 text-gray-400 hover:text-white">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleResetView} title="Reset View" className="p-1 text-gray-400 hover:text-white">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Container: Map Canvas + Side Detail Panel */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* SVG Vector Map */}
        <div 
          className="flex-1 relative cursor-grab active:cursor-grabbing bg-gray-950 overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            viewBox="0 0 900 600"
            className="w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.25s ease-out'
            }}
          >
            <defs>
              <pattern id="cleanGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
              </pattern>

              <radialGradient id="critHeatmap" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(239, 68, 68, 0.45)" />
                <stop offset="70%" stopColor="rgba(239, 68, 68, 0.15)" />
                <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
              </radialGradient>

              <radialGradient id="warnHeatmap" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(245, 158, 11, 0.35)" />
                <stop offset="70%" stopColor="rgba(245, 158, 11, 0.12)" />
                <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
              </radialGradient>
            </defs>

            <rect width="900" height="600" fill="url(#cleanGrid)" />

            {/* Shafts & Galleries */}
            <g opacity="0.9">
              {/* Shaft 1 */}
              <line x1="250" y1="40" x2="250" y2="540" stroke="#374151" strokeWidth="22" strokeLinecap="round" />
              <line x1="250" y1="40" x2="250" y2="540" stroke="#2563eb" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />

              {/* Shaft 2 */}
              <line x1="550" y1="60" x2="550" y2="520" stroke="#374151" strokeWidth="20" strokeLinecap="round" />
              <line x1="550" y1="60" x2="550" y2="520" stroke="#2563eb" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />

              {/* Galleries */}
              <line x1="120" y1="160" x2="400" y2="160" stroke="#374151" strokeWidth="18" strokeLinecap="round" />
              <line x1="360" y1="160" x2="460" y2="200" stroke="#374151" strokeWidth="18" strokeLinecap="round" />
              <line x1="460" y1="200" x2="700" y2="200" stroke="#374151" strokeWidth="18" strokeLinecap="round" />

              <line x1="250" y1="250" x2="550" y2="250" stroke="#374151" strokeWidth="22" strokeLinecap="round" />

              <line x1="100" y1="340" x2="380" y2="340" stroke="#374151" strokeWidth="18" strokeLinecap="round" />
              <line x1="380" y1="340" x2="550" y2="360" stroke="#374151" strokeWidth="18" strokeLinecap="round" />
              <line x1="550" y1="360" x2="720" y2="360" stroke="#374151" strokeWidth="18" strokeLinecap="round" />
            </g>

            {/* Evacuation Routes */}
            {showEvacuationRoutes && (
              <g id="evacPaths">
                <path d="M 200 150 L 250 150 L 250 50" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="8 6" />
                <path d="M 500 200 L 420 200 L 370 250" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="8 6" />
                <path d="M 600 360 L 480 360 L 370 250" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="4 4" />
                <circle cx="530" cy="360" r="8" fill="#ef4444" opacity="0.6" />
                <text x="530" y="363" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">⚠️</text>
              </g>
            )}

            {/* Zones */}
            <g id="zonesLayer">
              {filteredZones.map((zone) => {
                const coords = zone.coordinates || { x: 200, y: 200, width: 200, height: 100 };
                const isCrit = zone.risk_level === 'CRITICAL';
                const isWarn = zone.risk_level === 'WARNING';
                const isRefuge = zone.id === 'ZONE_E';

                const strokeColor = isCrit ? '#ef4444' : isWarn ? '#f59e0b' : isRefuge ? '#10b981' : '#3b82f6';
                const fillColor = isCrit
                  ? (showHazardHeatmap ? 'url(#critHeatmap)' : 'rgba(239, 68, 68, 0.15)')
                  : isWarn
                  ? (showHazardHeatmap ? 'url(#warnHeatmap)' : 'rgba(245, 158, 11, 0.12)')
                  : isRefuge
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(59, 130, 246, 0.06)';

                const isSelected = selectedObject?.type === 'ZONE' && selectedObject.data.id === zone.id;

                return (
                  <g
                    key={zone.id}
                    onClick={() => setSelectedObject({ type: 'ZONE', data: zone })}
                    className="cursor-pointer"
                  >
                    <rect
                      x={coords.x}
                      y={coords.y}
                      width={coords.width}
                      height={coords.height}
                      rx="6"
                      fill={fillColor}
                      stroke={isSelected ? '#ffffff' : strokeColor}
                      strokeWidth={isSelected ? '3' : isCrit ? '2.5' : '1.5'}
                      strokeDasharray={isCrit ? 'none' : '4 2'}
                      className={isCrit ? 'animate-pulse' : ''}
                    />

                    {/* Zone Badge */}
                    <rect x={coords.x + 8} y={coords.y + 8} width="70" height="18" rx="3" fill="#111827" stroke={strokeColor} strokeWidth="1" />
                    <text x={coords.x + 43} y={coords.y + 21} fill={strokeColor} fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold" textAnchor="middle">
                      {zone.code}
                    </text>
                    <text x={coords.x + 85} y={coords.y + 21} fill="#ffffff" fontSize="9.5" fontWeight="600">
                      {zone.name.slice(0, 22)}
                    </text>
                    <text x={coords.x + 10} y={coords.y + coords.height - 10} fill="#9ca3af" fontSize="9" fontFamily="JetBrains Mono">
                      Depth: {zone.level_depth_m}m • Sub: {zone.subsidence_velocity_mm_hr} mm/hr
                    </text>
                  </g>
                );
              })}
            </g>

            {/* IoT Sensors (Module 1) */}
            {showNodes && (
              <g id="sensorsLayer">
                {nodes.map((node) => {
                  const isCrit = node.status === 'CRITICAL';
                  const coords = node.coordinates || { x: 300, y: 250 };
                  const color = isCrit ? '#ef4444' : node.status === 'WARNING' ? '#f59e0b' : '#3b82f6';
                  const isSelected = selectedObject?.type === 'NODE' && selectedObject.data.id === node.id;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${coords.x}, ${coords.y})`}
                      onClick={() => setSelectedObject({ type: 'NODE', data: node })}
                      className="cursor-pointer"
                    >
                      {isCrit && (
                        <circle cx="0" cy="0" r="16" fill="none" stroke="#ef4444" strokeWidth="1.5">
                          <animate attributeName="r" values="8;24" dur="1.5s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="1;0" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <rect x="-8" y="-8" width="16" height="16" rx="3" fill="#111827" stroke={isSelected ? '#ffffff' : color} strokeWidth="2" />
                      <circle cx="0" cy="0" r="3" fill={color} />
                      <text x="0" y="-12" fill="#e5e7eb" fontSize="8.5" fontFamily="JetBrains Mono" fontWeight="bold" textAnchor="middle">
                        {node.code}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Smart Band Miners (Module 2) */}
            {showMiners && (
              <g id="minersLayer">
                {miners.map((miner) => {
                  const isSOS = miner.status === 'SOS';
                  const isFall = miner.status === 'FALL_DETECTED';
                  const isEvac = miner.status === 'EVACUATING';
                  const coords = miner.coordinates || { x: 200, y: 200 };
                  const color = (isSOS || isFall) ? '#ef4444' : isEvac ? '#f59e0b' : '#10b981';
                  const isSelected = selectedObject?.type === 'MINER' && selectedObject.data.id === miner.id;

                  return (
                    <g
                      key={miner.id}
                      transform={`translate(${coords.x}, ${coords.y})`}
                      onClick={() => setSelectedObject({ type: 'MINER', data: miner })}
                      className="cursor-pointer"
                    >
                      {(isSOS || isFall) && (
                        <circle cx="0" cy="0" r="20" fill="none" stroke="#ef4444" strokeWidth="2">
                          <animate attributeName="r" values="8;30" dur="1.2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="1;0" dur="1.2s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle cx="0" cy="0" r="9" fill="#111827" stroke={isSelected ? '#ffffff' : color} strokeWidth="2.5" />
                      <circle cx="0" cy="0" r="4" fill={color} />
                      <text x="0" y="20" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                        {miner.name.split(' ')[0]} ({miner.assigned_band_id})
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </svg>

          {/* Map Legend */}
          <div className="absolute bottom-3 left-3 bg-gray-900/95 p-2.5 rounded border border-gray-700 text-[11px] font-mono space-y-1 shadow-md">
            <div className="text-gray-400 font-bold uppercase text-[10px] mb-1">Mine Map Legend</div>
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> SAFE (&lt;1.0 mm/hr)
            </div>
            <div className="flex items-center gap-2 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> WARNING (1.0 - 5.0 mm/hr)
            </div>
            <div className="flex items-center gap-2 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-400"></span> CRITICAL (&gt;5.0 mm/hr / SOS)
            </div>
          </div>
        </div>

        {/* =========================================================================
            SIDE DETAIL PANEL (Spec: "Click object to open side detail panel")
            ========================================================================= */}
        {selectedObject && (
          <aside className="w-80 border-l border-gray-700 bg-gray-900 p-4 overflow-y-auto space-y-4 shadow-xl z-20 font-mono text-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700">
                  {selectedObject.type} DETAILS
                </span>
              </div>
              <button
                onClick={() => setSelectedObject(null)}
                className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If Zone Selected */}
            {selectedObject.type === 'ZONE' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-base font-sans">{selectedObject.data.name}</span>
                  <span className={`badge-status ${
                    selectedObject.data.risk_level === 'CRITICAL' ? 'badge-status-critical' : 'badge-status-safe'
                  }`}>
                    {selectedObject.data.risk_level}
                  </span>
                </div>

                <div className="p-3 rounded bg-gray-800 space-y-1.5 text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Zone Code:</span>
                    <strong className="text-white">{selectedObject.data.code}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Level Depth:</span>
                    <span>{selectedObject.data.level_depth_m} meters</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subsidence Rate:</span>
                    <span className={selectedObject.data.risk_level === 'CRITICAL' ? 'text-red-400 font-bold' : ''}>
                      {selectedObject.data.subsidence_velocity_mm_hr} mm/hr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Methane (CH4):</span>
                    <span>{selectedObject.data.gas_ch4_ppm}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Occupancy:</span>
                    <span className="text-blue-400 font-bold">{selectedObject.data.current_occupancy || 0} Miners</span>
                  </div>
                </div>

                <div className="text-[11px] text-gray-400">
                  <span className="text-gray-500">Evacuation Route:</span><br />
                  <span className="text-emerald-400 font-semibold">{selectedObject.data.evacuation_route}</span>
                </div>
              </div>
            )}

            {/* If Sensor Node Selected */}
            {selectedObject.type === 'NODE' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-base font-sans">{selectedObject.data.name}</span>
                  <span className={`badge-status ${
                    selectedObject.data.status === 'CRITICAL' ? 'badge-status-critical' : 'badge-status-safe'
                  }`}>
                    {selectedObject.data.status}
                  </span>
                </div>

                <div className="p-3 rounded bg-gray-800 space-y-1.5 text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Node Code:</span>
                    <strong className="text-white">{selectedObject.data.code}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sensor Type:</span>
                    <span className="text-blue-300">{selectedObject.data.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Zone Location:</span>
                    <span>{selectedObject.data.zone_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Battery Health:</span>
                    <span className="text-emerald-400 font-bold">{selectedObject.data.battery_pct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Signal:</span>
                    <span>{selectedObject.data.signal_dbm} dBm</span>
                  </div>
                </div>

                <div className="p-3 rounded bg-gray-950 border border-gray-800 space-y-1">
                  <div className="text-[10px] text-gray-400 uppercase">Live Telemetry Metrics:</div>
                  <pre className="text-blue-300 text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedObject.data.last_reading, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* If Miner Selected */}
            {selectedObject.type === 'MINER' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-base font-sans">{selectedObject.data.name}</div>
                    <div className="text-[11px] text-gray-400">{selectedObject.data.role_title}</div>
                  </div>
                  <span className={`badge-status ${
                    selectedObject.data.status === 'SOS' || selectedObject.data.status === 'FALL_DETECTED'
                      ? 'badge-status-critical'
                      : 'badge-status-safe'
                  }`}>
                    {selectedObject.data.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded bg-gray-800">
                    <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                      <Heart className="w-3 h-3 text-red-400" /> Heart Rate
                    </div>
                    <div className="text-lg font-bold text-white mt-0.5">
                      {selectedObject.data.vitals?.heart_rate || '--'} <span className="text-[10px] text-gray-400">bpm</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-gray-800">
                    <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                      <Activity className="w-3 h-3 text-blue-400" /> SpO2
                    </div>
                    <div className="text-lg font-bold text-white mt-0.5">
                      {selectedObject.data.vitals?.spo2 || '--'}%
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded bg-gray-800 space-y-1 text-gray-300 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Band ID:</span>
                    <strong className="text-white">{selectedObject.data.assigned_band_id}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Blood Type:</span>
                    <span>{selectedObject.data.blood_group}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Emergency Contact:</span>
                    <span>{selectedObject.data.emergency_contact}</span>
                  </div>
                </div>

                <button
                  onClick={onOpenEvacuateModal}
                  className="btn-industrial btn-industrial-danger w-full text-xs py-2"
                >
                  Broadcast Emergency Signal to Band
                </button>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
