import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  Calendar, 
  Activity, 
  Cpu, 
  Users, 
  Ambulance, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { fetchApi } from '../utils/api';
import { useLiveStream } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';

export default function Reports() {
  const { zones, refreshAll } = useLiveStream();
  const { user } = useAuth();

  const [reportsList, setReportsList] = useState([]);
  const [selectedReportType, setSelectedReportType] = useState('SENSOR_EVENTS');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [generating, setGenerating] = useState(false);
  const [activeReportData, setActiveReportData] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetchApi('/reports');
      if (res.data) setReportsList(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const res = await fetchApi('/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          report_type: selectedReportType,
          zone_id: selectedZone,
          date_from: dateFrom,
          date_to: dateTo,
          generated_by: user?.full_name || 'Arthur Pendelton'
        })
      });

      if (res.success && res.data) {
        setActiveReportData(res.data);
        await fetchReports();
      }
    } catch (e) {
      alert('Failed to generate report: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = () => {
    if (!activeReportData) return;
    const jsonStr = JSON.stringify(activeReportData.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeReportData.file_name.replace('.pdf', '.json');
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto print:p-0 print:bg-white print:text-black">
      {/* Header (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/90 border border-white/10 shadow-2xl print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              AUDIT & ANALYTICS
            </span>
            <span className="text-xs font-mono text-slate-400">Section 7 Specification</span>
          </div>
          <h1 className="text-xl font-display font-bold text-white tracking-wider mt-1 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            REPORTS & COMPLIANCE ANALYTICS
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Module 1 IoT Subsidence Reports, Module 2 Miner Safety Audits, and Incident Post-Mortems
          </p>
        </div>
      </div>

      {/* Generator Control Panel (Hidden on Print) */}
      <div className="glass-panel p-5 rounded-xl space-y-4 print:hidden">
        <h2 className="text-sm font-display font-bold text-white tracking-wider">
          GENERATE NEW COMPLIANCE REPORT
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <label className="block text-slate-400 mb-1">Report Classification:</label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="select-control w-full"
            >
              <option value="SENSOR_EVENTS">Module 1: IoT Subsidence & Strata Report</option>
              <option value="MINER_SAFETY">Module 2: Miner Smart Band Health Audit</option>
              <option value="RESCUE_INCIDENTS">SAR Rescue Incident Post-Mortem</option>
              <option value="ALERT_HISTORY">Central Unified Alert Lifecycle History</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Zone Filter:</label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="select-control w-full"
            >
              <option value="ALL">All Mine Zones (Full Complex)</option>
              {zones.map(z => (
                <option key={z.id} value={z.id}>{z.code} - {z.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Date From:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-control"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Date To:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-control"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="btn btn-primary btn-sm text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,254,0.3)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{generating ? 'COMPILING TELEMETRY...' : 'GENERATE REPORT NOW'}</span>
          </button>
        </div>
      </div>

      {/* Generated Report Display Area */}
      {activeReportData ? (
        <div className="glass-panel p-8 rounded-xl border border-cyan-500/30 space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Action Tools */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 print:hidden">
            <div className="flex items-center gap-2">
              <span className="badge badge-purple font-mono text-xs">{activeReportData.id}</span>
              <span className="text-xs font-mono text-slate-400">
                Generated: {new Date(activeReportData.created_at).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="btn btn-outline btn-sm text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="btn btn-primary btn-sm text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Data</span>
              </button>
            </div>
          </div>

          {/* Official Document Header */}
          <div className="text-center space-y-1 border-b border-white/10 pb-6 print:border-black">
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest print:text-black">
              MINEGUARD AI COMMAND CENTER • OFFICIAL AUDIT DOCUMENT
            </div>
            <h2 className="text-2xl font-display font-bold text-white tracking-wider print:text-black">
              {activeReportData.title}
            </h2>
            <p className="text-xs font-mono text-slate-400 print:text-slate-700">
              Coverage Window: {activeReportData.date_from} to {activeReportData.date_to} • Auditor: {activeReportData.generated_by}
            </p>
          </div>

          {/* Executive Summary */}
          <div className="p-4 rounded-lg bg-slate-900/80 border border-white/5 space-y-1.5 font-mono text-xs print:bg-slate-100 print:text-black">
            <div className="text-slate-400 uppercase font-display font-bold text-[10px] print:text-slate-800">
              Executive Summary & Scope:
            </div>
            <p className="text-slate-200 leading-relaxed print:text-black">
              {activeReportData.summary}
            </p>
          </div>

          {/* Structured Data Content */}
          <div className="space-y-4 font-mono text-xs">
            <div className="text-sm font-display font-bold text-white tracking-wider uppercase print:text-black">
              Telemetry & Compliance Metrics:
            </div>
            <pre className="bg-black/60 p-4 rounded-lg text-cyan-300 overflow-x-auto border border-white/10 print:bg-slate-50 print:text-black print:border-black">
              {JSON.stringify(activeReportData.data, null, 2)}
            </pre>
          </div>

          {/* Sign-off Footer */}
          <div className="pt-8 border-t border-white/10 flex justify-between items-center text-[11px] font-mono text-slate-400 print:text-slate-700">
            <div>Mine Complex: MINE_001 (Deep Horizon)</div>
            <div>Authorized Signature: _______________________</div>
          </div>
        </div>
      ) : (
        /* Prior Reports Archive Table */
        <div className="glass-panel p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-display font-bold text-white tracking-wider">
            ARCHIVED COMPLIANCE REPORTS
          </h2>
          <div className="space-y-2 font-mono text-xs">
            {reportsList.map((rep) => (
              <div
                key={rep.id}
                onClick={() => setActiveReportData(rep)}
                className="p-3.5 rounded-lg bg-slate-900/70 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/40 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-300">{rep.id}</span>
                    <span className="badge badge-purple text-[9px]">{rep.report_type}</span>
                    <span className="font-semibold text-white">{rep.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{rep.summary}</div>
                </div>
                <div className="text-[11px] text-slate-400 text-right flex-shrink-0">
                  <div>{rep.date_from} → {rep.date_to}</div>
                  <div className="text-cyan-400 underline mt-1">View Details</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
