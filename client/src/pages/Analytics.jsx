import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle,
  Flame,
  Gauge,
  Clock,
  Compass,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { useLiveStream } from '../context/WebSocketContext';
import { fetchApi } from '../utils/api';

export default function Analytics() {
  const { nodes, alerts, kpis, zones } = useLiveStream();
  
  const [selectedNodeId, setSelectedNodeId] = useState('NODE_001');
  const [selectedMetric, setSelectedMetric] = useState('');
  const [timeFilter, setTimeFilter] = useState('1h');
  const [telemetryHistory, setTelemetryHistory] = useState({});

  // Get current selected node
  const activeNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  // Derive available metrics from selected node type
  const getMetricsForNode = (node) => {
    if (!node || !node.last_reading) return [];
    return Object.keys(node.last_reading).filter(k => k !== 'timestamp');
  };

  const metrics = getMetricsForNode(activeNode);

  // Set default metric when node changes
  useEffect(() => {
    if (metrics.length > 0) {
      // Prefer rate or ch4 if available
      const ch4 = metrics.find(m => m.includes('ch4'));
      const rate = metrics.find(m => m.includes('rate') || m.includes('displacement') || m.includes('sag') || m.includes('event'));
      setSelectedMetric(rate || ch4 || metrics[0]);
    }
  }, [selectedNodeId, activeNode]);

  // Keep track of real-time history for charts (append whenever nodes update)
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      setTelemetryHistory(prev => {
        const next = { ...prev };
        nodes.forEach(node => {
          if (!next[node.id]) {
            // Seed initial data
            next[node.id] = [];
            // Generate some mock history points so chart isn't empty on load
            const baseTime = Date.now();
            for (let i = 15; i >= 1; i--) {
              const mockVal = getMockValueForMetric(node.id, getMetricsForNode(node)[0], i);
              next[node.id].push({
                time: new Date(baseTime - i * 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                timestamp: baseTime - i * 5000,
                readings: mockVal
              });
            }
          }
          
          // Append new real-time tick
          const lastReading = node.last_reading || {};
          const isDuplicate = next[node.id].length > 0 && 
            JSON.stringify(next[node.id][next[node.id].length - 1].readings) === JSON.stringify(lastReading);
            
          if (!isDuplicate) {
            next[node.id].push({
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              timestamp: Date.now(),
              readings: { ...lastReading }
            });
          }
          // Cap at last 25 entries
          if (next[node.id].length > 25) {
            next[node.id].shift();
          }
        });
        return next;
      });
    }
  }, [nodes]);

  // Helper to generate realistic historical baseline data
  const getMockValueForMetric = (nodeId, metric, index) => {
    const timeFactor = index * 0.1;
    if (nodeId === 'NODE_001') {
      return {
        displacement_rate_mm_hr: Number((3.5 + Math.sin(timeFactor) * 1.5).toFixed(2)),
        cumulative_displacement_mm: Number((35 + index * 0.8).toFixed(1)),
        tilt_pitch_deg: Number((2.1 + Math.sin(timeFactor) * 0.4).toFixed(2)),
        tilt_roll_deg: Number((1.8 + Math.cos(timeFactor) * 0.3).toFixed(2))
      };
    } else if (nodeId === 'NODE_004') {
      return {
        ch4_pct: Number((0.45 + Math.sin(timeFactor) * 0.15).toFixed(2)),
        co_ppm: Number((12 + index % 5).toFixed(0)),
        o2_pct: Number((20.1 - Math.sin(timeFactor) * 0.2).toFixed(1)),
        temp_c: Number((28.5 + Math.cos(timeFactor) * 0.8).toFixed(1))
      };
    } else {
      return {
        tilt_pitch_deg: Number((1.2 + Math.sin(timeFactor) * 0.2).toFixed(2)),
        tilt_roll_deg: Number((0.9 + Math.cos(timeFactor) * 0.2).toFixed(2)),
        pressure_kpa: Number((295 + Math.sin(timeFactor) * 5).toFixed(0)),
        water_table_depth_m: Number((48.2 + Math.sin(timeFactor) * 0.1).toFixed(2))
      };
    }
  };

  // Get current active node's history
  const activeHistory = telemetryHistory[selectedNodeId] || [];

  // Get active metric values
  const chartPoints = activeHistory.map(h => ({
    time: h.time,
    value: h.readings[selectedMetric] !== undefined ? h.readings[selectedMetric] : 0,
    timestamp: h.timestamp
  }));

  // Define Threshold values for validation and drawing warning/critical lines
  const getThresholdsForMetric = (metric) => {
    const name = metric.toLowerCase();
    if (name.includes('displacement_rate') || name.includes('subsidence')) {
      return { warning: 5.0, critical: 10.0, unit: 'mm/hr' };
    } else if (name.includes('ch4') || name.includes('methane')) {
      return { warning: 1.0, critical: 1.5, unit: '%' };
    } else if (name.includes('co') || name.includes('carbon')) {
      return { warning: 25.0, critical: 50.0, unit: 'ppm' };
    } else if (name.includes('vibration')) {
      return { warning: 2.5, critical: 4.5, unit: 'g' };
    } else if (name.includes('temp')) {
      return { warning: 40.0, critical: 50.0, unit: '°C' };
    } else if (name.includes('sag') || name.includes('crack')) {
      return { warning: 4.0, critical: 8.0, unit: 'mm' };
    } else if (name.includes('pressure')) {
      return { warning: 350.0, critical: 450.0, unit: 'kPa' };
    }
    return { warning: 80.0, critical: 95.0, unit: '' };
  };

  const currentThresh = getThresholdsForMetric(selectedMetric);

  // Dynamic Risk Score calculation based on active node status
  const calculateNodeRiskScore = (node) => {
    if (!node) return 15;
    if (node.status === 'CRITICAL') return 88;
    if (node.status === 'WARNING') return 52;
    return 18;
  };

  const activeRiskScore = calculateNodeRiskScore(activeNode);
  const riskCategory = activeRiskScore >= 70 ? 'CRITICAL RISK' : activeRiskScore >= 35 ? 'ELEVATED WARNING' : 'SAFE / NOMINAL';
  const riskColor = activeRiskScore >= 70 ? '#ff3366' : activeRiskScore >= 35 ? '#f76b1c' : '#39ff14';
  const riskGlow = activeRiskScore >= 70 ? 'shadow-[#ff3366]/20' : activeRiskScore >= 35 ? 'shadow-[#f76b1c]/20' : 'shadow-[#39ff14]/20';

  // Render SVG Line Chart
  const renderSVGChart = () => {
    if (chartPoints.length < 2) {
      return (
        <div className="flex h-full items-center justify-center font-mono text-xs text-[#8c9bb4]">
          <Activity className="w-5 h-5 text-[#00f2fe] animate-pulse mr-2" /> Ingesting Sensor Data Streams...
        </div>
      );
    }

    const width = 780;
    const height = 240;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Find min/max for scale
    const values = chartPoints.map(p => p.value);
    let maxValue = Math.max(...values, currentThresh.critical * 1.25);
    let minValue = Math.min(...values, 0);

    // Padding min/max
    const range = maxValue - minValue;
    maxValue = maxValue + range * 0.05;
    minValue = Math.max(0, minValue - range * 0.05);

    const getX = (index) => paddingLeft + (index / (chartPoints.length - 1)) * chartWidth;
    const getY = (val) => paddingTop + chartHeight - ((val - minValue) / (maxValue - minValue)) * chartHeight;

    // Build line path
    let pathD = `M ${getX(0)} ${getY(chartPoints[0].value)}`;
    for (let i = 1; i < chartPoints.length; i++) {
      pathD += ` L ${getX(i)} ${getY(chartPoints[i].value)}`;
    }

    // Build area path (for gradient fill under the line)
    const areaD = `${pathD} L ${getX(chartPoints.length - 1)} ${getY(minValue)} L ${getX(0)} ${getY(minValue)} Z`;

    // Warning and Critical Line Y positions
    const yWarn = getY(currentThresh.warning);
    const yCrit = getY(currentThresh.critical);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full font-mono text-[9px] text-[#8c9bb4]">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4facfe" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="critLineGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff3366" stopOpacity="1" />
            <stop offset="100%" stopColor="#ff3366" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const val = minValue + ratio * (maxValue - minValue);
          const y = getY(val);
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#1f2d52" strokeWidth="0.8" strokeDasharray="3 4" />
              <text x={paddingLeft - 8} y={y + 3} textAnchor="end" fill="#8c9bb4">{val.toFixed(1)}</text>
            </g>
          );
        })}

        {/* Vertical time grid lines */}
        {chartPoints.map((pt, idx) => {
          if (idx % 4 !== 0 && idx !== chartPoints.length - 1) return null;
          const x = getX(idx);
          return (
            <g key={idx}>
              <line x1={x} y1={paddingTop} x2={x} y2={height - paddingBottom} stroke="rgba(31, 45, 82, 0.4)" strokeWidth="0.8" />
              <text x={x} y={height - 12} textAnchor="middle" fill="#8c9bb4">{pt.time}</text>
            </g>
          );
        })}

        {/* Warning Threshold Line */}
        {yWarn >= paddingTop && yWarn <= height - paddingBottom && (
          <g>
            <line x1={paddingLeft} y1={yWarn} x2={width - paddingRight} y2={yWarn} stroke="#f76b1c" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.8" />
            <text x={width - paddingRight - 5} y={yWarn - 4} fill="#f76b1c" textAnchor="end" fontWeight="bold">WARNING LIMIT: {currentThresh.warning} {currentThresh.unit}</text>
          </g>
        )}

        {/* Critical Threshold Line */}
        {yCrit >= paddingTop && yCrit <= height - paddingBottom && (
          <g>
            <line x1={paddingLeft} y1={yCrit} x2={width - paddingRight} y2={yCrit} stroke="#ff3366" strokeWidth="1.5" strokeDasharray="none" opacity="0.8" />
            <text x={width - paddingRight - 5} y={yCrit - 4} fill="#ff3366" textAnchor="end" fontWeight="bold">CRITICAL BREACH LIMIT: {currentThresh.critical} {currentThresh.unit}</text>
          </g>
        )}

        {/* Area fill */}
        <path d={areaD} fill="url(#chartGradient)" />

        {/* Line plot */}
        <path d={pathD} fill="none" stroke="#00f2fe" strokeWidth="2.2" strokeLinecap="round" />

        {/* Data points markers */}
        {chartPoints.map((pt, idx) => {
          const isHigh = pt.value >= currentThresh.critical;
          const isWarn = pt.value >= currentThresh.warning && pt.value < currentThresh.critical;
          const color = isHigh ? '#ff3366' : isWarn ? '#f76b1c' : '#00f2fe';
          const r = isHigh ? '4' : '3.2';

          return (
            <g key={idx}>
              <circle cx={getX(idx)} cy={getY(pt.value)} r={r} fill="#060913" stroke={color} strokeWidth="2" />
              {isHigh && (
                <circle cx={getX(idx)} cy={getY(pt.value)} r="8" fill="none" stroke="#ff3366" strokeWidth="1">
                  <animate attributeName="r" values="3;10" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  // Filter Module 1 AI alerts only
  const m1Alerts = alerts.filter(a => a.source === 'MODULE_1_AI').slice(0, 5);

  // SVG Gauge calculations
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (activeRiskScore / 100) * circumference;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-[#f0f4f8] font-sans">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0d1326] border border-[#1f2d52] shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              MODULE 1: Sentinel Analytics
            </span>
            <span className="text-xs font-mono text-[#8c9bb4]">IoT Geotechnical Monitoring & AI Strata Risk</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide mt-1 flex items-center gap-2 font-mono">
            <Cpu className="w-5 h-5 text-[#00f2fe] filter drop-shadow-[0_0_5px_#00f2fe]" />
            Geotechnical Subsidence & AI Risk Engine
          </h1>
        </div>

        {/* Time filters */}
        <div className="flex items-center gap-1.5 bg-[#151d36] border border-[#1f2d52] rounded-lg p-0.5 font-mono text-xs text-[#8c9bb4]">
          {['1h', '6h', '24h', '7d'].map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                timeFilter === f ? 'bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-[#060913]' : 'text-gray-400 hover:text-white'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Nodes */}
        <div className="p-4 rounded-xl bg-[#0d1326] border border-[#1f2d52] flex flex-col justify-between shadow-2xl">
          <span className="text-[10px] font-mono font-bold text-[#8c9bb4] tracking-wider uppercase">TOTAL SENSOR NODES</span>
          <div className="text-3xl font-extrabold font-mono text-white mt-1.5">{nodes.length}</div>
          <span className="text-[10px] text-gray-500 mt-1">Multi-Frequency Arrays</span>
        </div>

        {/* KPI 2: Online */}
        <div className="p-4 rounded-xl bg-[#0d1326] border border-[#1f2d52] flex flex-col justify-between shadow-2xl">
          <span className="text-[10px] font-mono font-bold text-[#8c9bb4] tracking-wider uppercase">ONLINE TELEMETRY</span>
          <div className="text-3xl font-extrabold font-mono text-[#39ff14] mt-1.5">
            {nodes.filter(n => n.status !== 'OFFLINE').length}
          </div>
          <span className="text-[10px] text-[#39ff14] mt-1 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#39ff14] animate-pulse"></span> LoRa Link OK
          </span>
        </div>

        {/* KPI 3: Warning */}
        <div className="p-4 rounded-xl bg-[#0d1326] border border-[#1f2d52] flex flex-col justify-between shadow-2xl">
          <span className="text-[10px] font-mono font-bold text-[#8c9bb4] tracking-wider uppercase">WARNING BREACHES</span>
          <div className="text-3xl font-extrabold font-mono text-[#f76b1c] mt-1.5">
            {nodes.filter(n => n.status === 'WARNING').length}
          </div>
          <span className="text-[10px] text-gray-500 mt-1">Minor Strain Thresholds</span>
        </div>

        {/* KPI 4: Critical */}
        <div className="p-4 rounded-xl bg-[#0d1326] border border-[#1f2d52] flex flex-col justify-between shadow-2xl">
          <span className="text-[10px] font-mono font-bold text-[#8c9bb4] tracking-wider uppercase">CRITICAL FAILURES</span>
          <div className={`text-3xl font-extrabold font-mono mt-1.5 ${
            nodes.some(n => n.status === 'CRITICAL') ? 'text-[#ff3366] animate-pulse' : 'text-white'
          }`}>
            {nodes.filter(n => n.status === 'CRITICAL').length}
          </div>
          <span className="text-[10px] text-gray-500 mt-1">Roof Collapse Hazard</span>
        </div>

        {/* KPI 5: Avg Mine Risk */}
        <div className="p-4 rounded-xl bg-[#0d1326] border border-[#1f2d52] flex flex-col justify-between shadow-2xl">
          <span className="text-[10px] font-mono font-bold text-[#8c9bb4] tracking-wider uppercase">MINE THREAT INDEX</span>
          <div className="text-3xl font-extrabold font-mono text-[#00f2fe] mt-1.5">
            {kpis ? kpis.mine_threat_index : 18}%
          </div>
          <span className="text-[10px] text-gray-500 mt-1">Aggregated Safety Index</span>
        </div>
      </div>

      {/* 3. Main Area: Selectable Live Trend Chart + Risk Score Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Telemetry Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0d1326] border border-[#1f2d52] flex flex-col justify-between shadow-2xl">
          
          {/* Chart Header controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1f2d52] gap-3 mb-4">
            
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00f2fe] animate-pulse"></span>
              <h2 className="text-sm font-bold text-white tracking-wider uppercase font-mono">
                Sensor Telemetry & Strain Waveforms
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
              {/* Select Node */}
              <div className="flex items-center gap-1.5 bg-[#151d36] border border-[#1f2d52] rounded-lg px-2.5 py-1 text-[#f0f4f8]">
                <Cpu className="w-3.5 h-3.5 text-[#00f2fe]" />
                <span className="text-gray-400">Node:</span>
                <select
                  value={selectedNodeId}
                  onChange={(e) => setSelectedNodeId(e.target.value)}
                  className="bg-transparent font-bold border-none outline-none cursor-pointer"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id} className="bg-[#0d1326] text-white">{n.code} - {n.name.split(' ')[0]}</option>
                  ))}
                </select>
              </div>

              {/* Select Metric */}
              <div className="flex items-center gap-1.5 bg-[#151d36] border border-[#1f2d52] rounded-lg px-2.5 py-1 text-[#f0f4f8]">
                <TrendingUp className="w-3.5 h-3.5 text-[#00f2fe]" />
                <span className="text-gray-400">Metric:</span>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="bg-transparent font-bold border-none outline-none cursor-pointer"
                >
                  {metrics.map(m => (
                    <option key={m} value={m} className="bg-[#0d1326] text-white">{m.replace(/_/g, ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SVG line chart plot */}
          <div className="w-full h-[250px] bg-[#060913]/60 rounded-lg border border-[#1f2d52]/50 p-2 relative overflow-hidden flex items-center justify-center">
            {renderSVGChart()}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-gray-500 mt-2 border-t border-[#1f2d52] pt-2">
            <span>Chart Scale: Real-Time telemetry stream</span>
            <span>Warning Limit: <strong className="text-[#f76b1c]">{currentThresh.warning} {currentThresh.unit}</strong> • Critical Limit: <strong className="text-[#ff3366]">{currentThresh.critical} {currentThresh.unit}</strong></span>
          </div>
        </div>

        {/* Right 1 Col: AI Risk Score Circular Gauge */}
        <div className="p-5 rounded-xl bg-[#0d1326] border border-[#1f2d52] flex flex-col justify-between shadow-2xl">
          <div className="pb-3 border-b border-[#1f2d52] flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#00f2fe]" />
            <h2 className="text-sm font-bold text-white tracking-wider uppercase font-mono">
              AI Strata Failure Risk
            </h2>
          </div>

          {/* Circle Gauge */}
          <div className="flex flex-col items-center justify-center py-6 relative">
            <svg className="w-36 h-36 transform -rotate-90">
              {/* Back track */}
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-[#151d36]"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Progress Arc */}
              <circle
                cx="72"
                cy="72"
                r={radius}
                stroke={riskColor}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.8s ease' }}
              />
            </svg>
            
            {/* Inside circular value */}
            <div className="absolute text-center mt-[-8px]">
              <span className="text-3xl font-extrabold font-mono text-white leading-none">
                {activeRiskScore}%
              </span>
              <div className="text-[10px] text-gray-400 font-mono mt-1">CONFIDENCE</div>
            </div>
            
            <div className="mt-4 text-center">
              <span className="badge-status font-bold text-[10px]" style={{ color: riskColor, borderColor: riskColor, background: `${riskColor}10` }}>
                {riskCategory}
              </span>
            </div>
          </div>

          {/* AI Insight Card explaining major risk factors */}
          <div className="p-3.5 rounded-lg bg-[#060913] border border-[#1f2d52] font-mono text-xs space-y-1.5">
            <span className="text-[9px] font-bold text-[#00f2fe] uppercase">AI Risk Factors Explanatory Insights</span>
            <p className="text-gray-300 font-sans text-xs" id="ai-insight-text">
              {activeRiskScore >= 70 ? (
                `CRITICAL strata subsidence anomaly detected at ${activeNode.code}. LSTM prediction indicates high risk of roof collapse/instability. Structural Failure Window: <28 mins.`
              ) : activeRiskScore >= 35 ? (
                `WARNING: Micro-seismic geophones detect creep rate acceleration at ${activeNode.code}. Structural integrity is elevated; monitoring suggested.`
              ) : (
                `Safe conditions. Primary telemetry parameters (methane gas ${activeNode.last_reading.ch4_pct !== undefined ? activeNode.last_reading.ch4_pct + '%' : '0.35%'}, vibration ${activeNode.last_reading.vibration_g !== undefined ? activeNode.last_reading.vibration_g + 'g' : '0.45g'}) within baseline values.`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Second Row: Node Health status & Recent Anomalies feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Node Health Grid */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0d1326] border border-[#1f2d52] space-y-3 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f2d52]">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#00f2fe]" />
              Sensor Health & Battery Diagnostics
            </h3>
            <span className="text-xs font-mono text-[#8c9bb4]">{nodes.length} Registered Stations</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
            {nodes.map(n => {
              const isCrit = n.status === 'CRITICAL';
              const isWarn = n.status === 'WARNING';

              return (
                <div key={n.id} className="p-3 rounded-lg bg-[#060913]/60 border border-[#1f2d52] flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[13px]">{n.code}</span>
                    <span className={`badge-status ${
                      isCrit ? 'badge-status-critical' : isWarn ? 'badge-status-warning' : 'badge-status-safe'
                    } text-[9px]`}>
                      {n.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8c9bb4] font-sans truncate">{n.name}</div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-[#1f2d52]/50">
                    <span className="flex items-center gap-1">🔋 {n.battery_pct}%</span>
                    <span>📶 {n.signal_dbm} dBm</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent AI / InSAR Anomalies Feed */}
        <div className="p-5 rounded-xl bg-[#0d1326] border border-[#1f2d52] space-y-3 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f2d52]">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#ff3366]" />
              AI Anomaly & Stress Stream
            </h3>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 font-mono text-xs">
            {m1Alerts.length > 0 ? (
              m1Alerts.map(a => (
                <div key={a.id} className="p-2.5 rounded bg-[#060913]/80 border border-[#ff3366]/40 flex flex-col space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-[#ff3366]">{a.id}</span>
                    <span className="text-gray-500">{new Date(a.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-white font-semibold font-sans text-xs">{a.title}</div>
                  <div className="text-gray-400 text-[11px] line-clamp-1">{a.description}</div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center space-y-2">
                <CheckCircle className="w-8 h-8 text-[#39ff14]" />
                <div>No anomalies detected in the current shift.</div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 5. Bottom: Latest Environmental & Telemetry Readings Table */}
      <div className="p-5 rounded-xl bg-[#0d1326] border border-[#1f2d52] space-y-3 shadow-2xl">
        <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono pb-2 border-b border-[#1f2d52]">
          Real-Time Sensor Telemetry Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="text-[#8c9bb4] border-b border-[#1f2d52] text-[10px] uppercase">
                <th className="pb-2">Station Code</th>
                <th className="pb-2">Sector Zone</th>
                <th className="pb-2">Station Type</th>
                <th className="pb-2">Primary Telemetry Metrics</th>
                <th className="pb-2">Risk Rating</th>
                <th className="pb-2 text-right">Last Check-In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2d52]/50 text-gray-300">
              {nodes.map((node) => {
                const isCrit = node.status === 'CRITICAL';
                const isWarn = node.status === 'WARNING';
                
                return (
                  <tr key={node.id} className="hover:bg-[#151d36]/30">
                    <td className="py-2.5 font-bold text-white">{node.code}</td>
                    <td className="py-2.5 text-gray-400">{node.zone_name}</td>
                    <td className="py-2.5 text-cyan-400">{node.type.replace(/_/g, ' ')}</td>
                    <td className="py-2.5 font-sans text-xs">
                      {Object.entries(node.last_reading || {})
                        .filter(([k]) => k !== 'timestamp')
                        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
                        .join(' | ')}
                    </td>
                    <td className="py-2.5">
                      <span className={`badge-status text-[9px] ${
                        isCrit ? 'badge-status-critical' : isWarn ? 'badge-status-warning' : 'badge-status-safe'
                      }`}>
                        {node.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-gray-500 font-mono text-[10px]">
                      {new Date(node.last_seen || Date.now()).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
