import React, { useState } from 'react';
import { 
  Layers, 
  Cpu, 
  Plus, 
  MapPin, 
  AlertTriangle, 
  Activity, 
  ShieldCheck, 
  Radio, 
  Trash2, 
  Edit3,
  Sliders
} from 'lucide-react';
import { useLiveStream } from '../context/WebSocketContext';
import { fetchApi } from '../utils/api';

export default function ZoneManagement() {
  const { zones, nodes, miners, refreshAll } = useLiveStream();

  const [activeTabSub, setActiveTabSub] = useState('ZONES'); // 'ZONES', 'SENSORS', 'BANDS'
  const [newZoneModalOpen, setNewZoneModalOpen] = useState(false);
  const [newNodeModalOpen, setNewNodeModalOpen] = useState(false);

  // New Zone Form
  const [zoneName, setZoneName] = useState('');
  const [zoneDepth, setZoneDepth] = useState('250');
  const [zoneSubLimit, setZoneSubLimit] = useState('5.0');
  const [zoneGasLimit, setZoneGasLimit] = useState('1.25');
  const [zoneCapacity, setZoneCapacity] = useState('25');
  const [zoneEvac, setZoneEvac] = useState('Crosscut Incline -> Shaft 1 Escape Hoist');

  // New Sensor Node Form
  const [nodeName, setNodeName] = useState('');
  const [nodeZoneId, setNodeZoneId] = useState('ZONE_A');
  const [nodeType, setNodeType] = useState('SUBSIDENCE_RADAR');

  const handleCreateZone = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/mine-zones', {
        method: 'POST',
        body: JSON.stringify({
          name: zoneName,
          level_depth_m: Number(zoneDepth),
          subsidence_threshold_mm: Number(zoneSubLimit),
          gas_threshold_ppm: Number(zoneGasLimit),
          max_capacity: Number(zoneCapacity),
          evacuation_route: zoneEvac
        })
      });
      await refreshAll();
      setNewZoneModalOpen(false);
      setZoneName('');
    } catch (err) {
      alert('Error creating zone: ' + err.message);
    }
  };

  const handleCreateNode = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/sensor-nodes', {
        method: 'POST',
        body: JSON.stringify({
          name: nodeName,
          zone_id: nodeZoneId,
          type: nodeType
        })
      });
      await refreshAll();
      setNewNodeModalOpen(false);
      setNodeName('');
    } catch (err) {
      alert('Error registering sensor: ' + err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/90 border border-white/10 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              GEOTECHNICAL ASSETS
            </span>
            <span className="text-xs font-mono text-slate-400">Section 3 Configuration</span>
          </div>
          <h1 className="text-xl font-display font-bold text-white tracking-wider mt-1 flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            ZONE & SENSOR HUB MANAGEMENT
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Configure Mine Structural Zones, IoT Geotechnical Nodes (Mod 1) & Smart Bands (Mod 2)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-950 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setActiveTabSub('ZONES')}
              className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                activeTabSub === 'ZONES' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mine Zones ({zones.length})
            </button>
            <button
              onClick={() => setActiveTabSub('SENSORS')}
              className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                activeTabSub === 'SENSORS' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              IoT Sensors ({nodes.length})
            </button>
          </div>

          {activeTabSub === 'ZONES' ? (
            <button
              onClick={() => setNewZoneModalOpen(true)}
              className="btn btn-primary btn-sm text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD MINE ZONE</span>
            </button>
          ) : (
            <button
              onClick={() => setNewNodeModalOpen(true)}
              className="btn btn-primary btn-sm text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>REGISTER SENSOR</span>
            </button>
          )}
        </div>
      </div>

      {activeTabSub === 'ZONES' ? (
        /* Zones Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {zones.map((zone) => {
            const isCrit = zone.risk_level === 'CRITICAL';
            const isWarn = zone.risk_level === 'WARNING';

            return (
              <div
                key={zone.id}
                className={`glass-panel p-5 rounded-xl border space-y-3 relative ${
                  isCrit ? 'border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : isWarn ? 'border-amber-500/40' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm px-2 py-0.5 rounded bg-slate-900 text-cyan-300 font-bold border border-cyan-500/30">
                      {zone.code}
                    </span>
                    <span className={`badge ${
                      isCrit ? 'badge-critical' : isWarn ? 'badge-warning' : 'badge-safe'
                    }`}>
                      {zone.risk_level}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Depth: {zone.level_depth_m}m
                  </span>
                </div>

                <h3 className="text-base font-display font-bold text-white">
                  {zone.name}
                </h3>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-white/5 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subsidence Velocity:</span>
                    <span className={isCrit ? 'text-red-400 font-bold' : 'text-slate-200'}>
                      {zone.subsidence_velocity_mm_hr} mm/hr (Limit: {zone.subsidence_threshold_mm} mm/hr)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gas Level (CH4):</span>
                    <span className="text-slate-200">{zone.gas_ch4_ppm}% (Limit: {zone.gas_threshold_ppm}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Occupancy:</span>
                    <span className="text-cyan-300 font-bold">{zone.current_occupancy || 0} / {zone.max_capacity} Miners</span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400">
                  <span className="text-slate-500">Evacuation Pathway:</span><br />
                  <span className="text-emerald-400">{zone.evacuation_route}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Sensors Table */
        <div className="glass-panel rounded-xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/90 text-slate-400 font-display uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Node Code</th>
                <th className="p-3.5">Sensor Name</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Zone Location</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Battery</th>
                <th className="p-3.5">Telemetry Metrics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {nodes.map((node) => (
                <tr key={node.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-bold text-cyan-300">{node.code}</td>
                  <td className="p-3.5 font-display font-semibold text-slate-200">{node.name}</td>
                  <td className="p-3.5 text-purple-300">{node.type}</td>
                  <td className="p-3.5 text-slate-300">{node.zone_name}</td>
                  <td className="p-3.5">
                    <span className={`badge ${
                      node.status === 'CRITICAL' ? 'badge-critical' : node.status === 'WARNING' ? 'badge-warning' : 'badge-safe'
                    }`}>
                      {node.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-emerald-400 font-bold">{node.battery_pct}%</td>
                  <td className="p-3.5 text-[11px] text-slate-300">
                    {node.last_reading?.displacement_rate_mm_hr !== undefined && (
                      <span>Displacement: {node.last_reading.displacement_rate_mm_hr} mm/hr</span>
                    )}
                    {node.last_reading?.ch4_pct !== undefined && (
                      <span>CH4: {node.last_reading.ch4_pct}% | CO: {node.last_reading.co_ppm} ppm</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Zone Modal */}
      {newZoneModalOpen && (
        <div className="modal-backdrop">
          <div className="glass-panel w-full max-w-lg p-6 rounded-xl relative text-slate-100 shadow-2xl">
            <h2 className="text-lg font-display font-bold text-white tracking-wider mb-4 border-b border-white/10 pb-3">
              DEFINE NEW MINE ZONE
            </h2>
            <form onSubmit={handleCreateZone} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Zone Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sub-level 450m Ore Chute"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="input-control"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Depth Level (meters):</label>
                  <input
                    type="number"
                    value={zoneDepth}
                    onChange={(e) => setZoneDepth(e.target.value)}
                    className="input-control"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Max Capacity (Miners):</label>
                  <input
                    type="number"
                    value={zoneCapacity}
                    onChange={(e) => setZoneCapacity(e.target.value)}
                    className="input-control"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Subsidence Threshold (mm/hr):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={zoneSubLimit}
                    onChange={(e) => setZoneSubLimit(e.target.value)}
                    className="input-control"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Gas Threshold (CH4 %):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={zoneGasLimit}
                    onChange={(e) => setZoneGasLimit(e.target.value)}
                    className="input-control"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Designated Evacuation Exit Route:</label>
                <input
                  type="text"
                  value={zoneEvac}
                  onChange={(e) => setZoneEvac(e.target.value)}
                  className="input-control"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewZoneModalOpen(false)}
                  className="btn btn-outline btn-sm text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm text-xs"
                >
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Sensor Node Modal */}
      {newNodeModalOpen && (
        <div className="modal-backdrop">
          <div className="glass-panel w-full max-w-lg p-6 rounded-xl relative text-slate-100 shadow-2xl">
            <h2 className="text-lg font-display font-bold text-white tracking-wider mb-4 border-b border-white/10 pb-3">
              REGISTER IOT SENSOR NODE (MODULE 1)
            </h2>
            <form onSubmit={handleCreateNode} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Sensor Display Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Laser Strata Convergence Array"
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  className="input-control"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Assigned Mine Zone:</label>
                  <select
                    value={nodeZoneId}
                    onChange={(e) => setNodeZoneId(e.target.value)}
                    className="select-control w-full"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.code} - {z.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Sensor Type:</label>
                  <select
                    value={nodeType}
                    onChange={(e) => setNodeType(e.target.value)}
                    className="select-control w-full"
                  >
                    <option value="SUBSIDENCE_RADAR">InSAR / Radar Subsidence</option>
                    <option value="TILTMETER_BOREHOLE">Borehole Tiltmeter</option>
                    <option value="ACOUSTIC_EMISSION">Micro-Seismic Acoustic</option>
                    <option value="GAS_CH4_CO">NDIR Multi-Gas Sensor</option>
                    <option value="PORE_PRESSURE">Pore Pressure Piezometer</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewNodeModalOpen(false)}
                  className="btn btn-outline btn-sm text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm text-xs"
                >
                  Register Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
