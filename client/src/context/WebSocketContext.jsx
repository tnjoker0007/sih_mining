import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchApi } from '../utils/api';
import { audioAlerts } from '../utils/audio';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [miners, setMiners] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [zones, setZones] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [latestBroadcast, setLatestBroadcast] = useState(null);
  const [soundMuted, setSoundMuted] = useState(false);
  const [lastTickTime, setLastTickTime] = useState(Date.now());

  // Toggle sound
  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    audioAlerts.setMuted(next);
  };

  // Initial Full Data Fetch
  const refreshAll = useCallback(async () => {
    try {
      const [alertsRes, minersRes, nodesRes, zonesRes, incRes, kpiRes] = await Promise.all([
        fetchApi('/alerts').catch(() => ({ data: [] })),
        fetchApi('/miners').catch(() => ({ data: [] })),
        fetchApi('/sensor-nodes').catch(() => ({ data: [] })),
        fetchApi('/mine-zones').catch(() => ({ data: [] })),
        fetchApi('/incidents').catch(() => ({ data: [] })),
        fetchApi('/reports/analytics/summary').catch(() => ({ data: null }))
      ]);

      if (alertsRes.data) setAlerts(alertsRes.data);
      if (minersRes.data) setMiners(minersRes.data);
      if (nodesRes.data) setNodes(nodesRes.data);
      if (zonesRes.data) setZones(zonesRes.data);
      if (incRes.data) setIncidents(incRes.data);
      if (kpiRes.data) setKpis(kpiRes.data);
    } catch (e) {
      console.error('Failed to initial fetch:', e);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // WebSocket Connection
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname === 'localhost' ? 'localhost:5000' : window.location.host;
      const wsUrl = `${protocol}//${host}`;

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('[WS] Connected to MineGuard Server');
          setConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const { type, data } = message;

            if (type === 'TELEMETRY_TICK') {
              if (data.miners) setMiners(data.miners);
              if (data.sensor_nodes) setNodes(data.sensor_nodes);
              if (data.mine_zones) setZones(data.mine_zones);
              setLastTickTime(Date.now());
            } else if (type === 'NEW_ALERT') {
              setAlerts(prev => [data, ...prev]);
              if (data.severity === 'CRITICAL') {
                audioAlerts.playCriticalAlert();
              } else {
                audioAlerts.playWarningChime();
              }
              // Refresh KPIs
              fetchApi('/reports/analytics/summary').then(res => res.data && setKpis(res.data)).catch(() => {});
            } else if (type === 'ALERT_UPDATED') {
              setAlerts(prev => prev.map(a => (a.id === data.id ? data : a)));
              fetchApi('/reports/analytics/summary').then(res => res.data && setKpis(res.data)).catch(() => {});
            } else if (type === 'NEW_INCIDENT') {
              setIncidents(prev => [data, ...prev]);
              audioAlerts.playCriticalAlert();
            } else if (type === 'INCIDENT_UPDATED') {
              setIncidents(prev => prev.map(i => (i.id === data.id ? data : i)));
              if (data.status === 'MINER_SAFE_RESOLVED') {
                audioAlerts.playSuccess();
              }
              fetchApi('/reports/analytics/summary').then(res => res.data && setKpis(res.data)).catch(() => {});
            } else if (type === 'EMERGENCY_BROADCAST') {
              setLatestBroadcast(data);
              audioAlerts.playEvacuationSiren();
            } else if (type === 'SYSTEM_RESET') {
              refreshAll();
            }
          } catch (err) {
            console.error('[WS] Parse error:', err);
          }
        };

        ws.onclose = () => {
          console.log('[WS] Disconnected, scheduling reconnect...');
          setConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = (err) => {
          console.error('[WS] Error:', err);
          ws.close();
        };
      } catch (err) {
        console.error('[WS] Connection exception:', err);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [refreshAll]);

  return (
    <WebSocketContext.Provider value={{
      connected,
      alerts,
      miners,
      nodes,
      zones,
      incidents,
      kpis,
      latestBroadcast,
      soundMuted,
      toggleSound,
      refreshAll,
      lastTickTime
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useLiveStream() {
  return useContext(WebSocketContext);
}
