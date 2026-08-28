import React, { useState, useEffect } from 'react';
import { 
  BellRing, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Ambulance, 
  Search, 
  Radio, 
  History, 
  Plus, 
  ShieldAlert,
  Cpu,
  User,
  Check,
  Pin
} from 'lucide-react';
import { useLiveStream } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../utils/api';
import AlertDetailModal from '../components/AlertDetailModal';

export default function Alerts({ setActiveTab }) {
  const { alerts, zones, refreshAll } = useLiveStream();
  const { user } = useAuth();

  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSource, setFilterSource] = useState('ALL');
  const [filterZone, setFilterZone] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabSub, setActiveTabSub] = useState('FEED'); // 'FEED' or 'HISTORY'
  const [historyList, setHistoryList] = useState([]);

  const [selectedAlert, setSelectedAlert] = useState(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  // Manual Alert Form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualSeverity, setManualSeverity] = useState('WARNING');
  const [manualZoneId, setManualZoneId] = useState('ZONE_A');

  useEffect(() => {
    if (activeTabSub === 'HISTORY') {
      fetchApi('/alerts/history')
        .then(res => res.data && setHistoryList(res.data))
        .catch(console.error);
    }
  }, [activeTabSub]);

  const handleCreateManualAlert = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/alerts', {
        method: 'POST',
        body: JSON.stringify({
          title: manualTitle,
          description: manualDesc,
          severity: manualSeverity,
          zone_id: manualZoneId,
          source: 'OPERATOR'
        })
      });
      await refreshAll();
      setManualModalOpen(false);
      setManualTitle('');
      setManualDesc('');
    } catch (err) {
      alert('Error dispatching alert: ' + err.message);
    }
  };

  // Filter logic
  const filteredAlerts = alerts.filter(alert => {
    if (filterSeverity !== 'ALL' && alert.severity !== filterSeverity) return false;
    if (filterStatus !== 'ALL' && alert.status !== filterStatus) return false;
    if (filterSource !== 'ALL' && alert.source !== filterSource) return false;
    if (filterZone !== 'ALL' && alert.zone_id !== filterZone) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        alert.title.toLowerCase().includes(q) ||
        alert.description.toLowerCase().includes(q) ||
        alert.code.toLowerCase().includes(q) ||
        (alert.zone_name && alert.zone_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pinnedCriticalAlerts = filteredAlerts.filter(a => a.severity === 'CRITICAL' && a.status === 'NEW');
  const regularAlerts = filteredAlerts.filter(a => !(a.severity === 'CRITICAL' && a.status === 'NEW'));

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto font-sans text-gray-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-gray-900 border border-gray-700 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700">
              CENTRAL ALERTS
            </span>
            <span className="text-xs font-mono text-gray-400">Lifecycle: NEW → ACKNOWLEDGED → IN PROGRESS → RESOLVED</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide mt-1 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-400" />
            Central Alert Management
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-950 border border-gray-700 rounded p-0.5 font-mono text-xs">
            <button
              onClick={() => setActiveTabSub('FEED')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                activeTabSub === 'FEED' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Alert Feed ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTabSub('HISTORY')}
              className={`px-3 py-1 rounded font-semibold transition-colors flex items-center gap-1 ${
                activeTabSub === 'HISTORY' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Audit Log
            </button>
          </div>

          <button
            onClick={() => setManualModalOpen(true)}
            className="btn-industrial btn-industrial-primary text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dispatch Alert</span>
          </button>
        </div>
      </div>

      {activeTabSub === 'FEED' ? (
        <>
          {/* Filters */}
          <div className="industrial-card p-3 flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search alerts, zones, miners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-industrial pl-9 text-xs"
              />
            </div>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="select-industrial text-xs"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">🔴 CRITICAL</option>
              <option value="WARNING">🟡 WARNING</option>
              <option value="INFO">🔵 INFO</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select-industrial text-xs"
            >
              <option value="ALL">All Lifecycle States</option>
              <option value="NEW">NEW</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>

            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="select-industrial text-xs"
            >
              <option value="ALL">All Sources</option>
              <option value="MODULE_1_AI">Module 1 (AI InSAR)</option>
              <option value="MODULE_2_BAND">Module 2 (Smart Band)</option>
              <option value="SENSOR_NODE">IoT Sensor Node</option>
              <option value="OPERATOR">Control Room</option>
            </select>

            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="select-industrial text-xs"
            >
              <option value="ALL">All Zones</option>
              {zones.map(z => (
                <option key={z.id} value={z.id}>{z.code} - {z.name}</option>
              ))}
            </select>
          </div>

          {/* Pinned Critical Alerts Section (Spec: "Critical alerts remain pinned until acknowledged") */}
          {pinnedCriticalAlerts.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-red-400 uppercase font-mono flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5" /> Pinned Unacknowledged Critical Hazards ({pinnedCriticalAlerts.length})
              </div>
              <div className="space-y-2">
                {pinnedCriticalAlerts.map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className="p-4 rounded-lg bg-red-950/70 border-2 border-red-500 hover:border-red-400 cursor-pointer shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 animate-pulse"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="font-bold text-white bg-red-900 px-2 py-0.5 rounded">{alert.id}</span>
                        <span className="badge-status badge-status-critical">CRITICAL</span>
                        <span className="badge-status badge-status-info">{alert.source.replace(/_/g, ' ')}</span>
                        <span className="text-red-300">{new Date(alert.created_at).toLocaleTimeString()}</span>
                      </div>
                      <h3 className="font-bold text-white text-base">{alert.title}</h3>
                      <p className="text-xs text-red-200">{alert.description}</p>
                    </div>
                    <button className="btn-industrial btn-industrial-danger text-xs whitespace-nowrap">
                      Acknowledge / Escalate →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Alert Stream */}
          <div className="space-y-2.5">
            {regularAlerts.map((alert) => {
              const isCrit = alert.severity === 'CRITICAL';
              const isWarn = alert.severity === 'WARNING';
              const isResolved = alert.status === 'RESOLVED';

              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isCrit 
                      ? 'bg-red-950/30 border-red-500/40 hover:border-red-400' 
                      : isWarn 
                      ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                      : isResolved
                      ? 'bg-gray-900/40 border-gray-800 opacity-75'
                      : 'bg-gray-900 border-gray-700 hover:border-blue-500'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                      <span className="font-bold text-white bg-gray-800 px-1.5 py-0.2 rounded">{alert.id}</span>
                      <span className={`badge-status ${
                        isCrit ? 'badge-status-critical' : isWarn ? 'badge-status-warning' : 'badge-status-info'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="badge-status badge-status-info text-[10px]">
                        {alert.source.replace(/_/g, ' ')}
                      </span>
                      <span className={`badge-status ${isResolved ? 'badge-status-safe' : 'badge-status-info'}`}>
                        {alert.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-gray-400 text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(alert.created_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm">{alert.title}</h3>
                    <p className="text-xs text-gray-300 line-clamp-1">{alert.description}</p>

                    <div className="text-[11px] text-gray-400 flex items-center gap-3 font-mono">
                      <span>📍 Zone: <strong className="text-blue-300">{alert.zone_name}</strong></span>
                      {alert.ai_confidence && <span className="text-purple-300">AI Risk: {alert.ai_confidence}%</span>}
                      {alert.miner_name && <span className="text-amber-300">Miner: {alert.miner_name}</span>}
                    </div>
                  </div>

                  <button className="btn-industrial btn-industrial-outline text-xs whitespace-nowrap">
                    Inspect Details →
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* History Audit */
        <div className="industrial-card p-4 space-y-3 font-mono text-xs">
          <h2 className="font-bold text-white text-sm uppercase">Alert Lifecycle Audit Trail</h2>
          <div className="space-y-2">
            {historyList.map(h => (
              <div key={h.id} className="p-2.5 rounded bg-gray-800 border border-gray-700 flex justify-between items-center">
                <div>
                  <span className="font-bold text-blue-400">{h.alert_id}</span> • <span className="text-purple-300 font-semibold">{h.action}</span> • <span className="text-gray-400">{h.changed_by}</span>
                  <div className="text-gray-200 mt-0.5">{h.notes}</div>
                </div>
                <span className="text-gray-500 text-[10px]">{new Date(h.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Alert Modal */}
      {manualModalOpen && (
        <div className="modal-backdrop">
          <div className="industrial-card w-full max-w-lg p-5 rounded-lg text-gray-100 shadow-2xl">
            <h2 className="text-base font-bold text-white mb-3 border-b border-gray-700 pb-2">
              Dispatch Operational Safety Notice
            </h2>
            <form onSubmit={handleCreateManualAlert} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-gray-400 mb-1">Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Auxiliary Fan Maintenance Scheduled"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="input-industrial"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Severity:</label>
                  <select
                    value={manualSeverity}
                    onChange={(e) => setManualSeverity(e.target.value)}
                    className="select-industrial w-full"
                  >
                    <option value="INFO">INFO</option>
                    <option value="WARNING">WARNING</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Zone:</label>
                  <select
                    value={manualZoneId}
                    onChange={(e) => setManualZoneId(e.target.value)}
                    className="select-industrial w-full"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.code} - {z.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Description:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide instructions and context..."
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  className="input-industrial"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="btn-industrial btn-industrial-outline text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-industrial btn-industrial-primary text-xs"
                >
                  Dispatch Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onEscalateSuccess={() => setActiveTab('rescue')}
        />
      )}
    </div>
  );
}
