import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  Layers, 
  BellRing, 
  Ambulance, 
  Users, 
  FileText, 
  Settings, 
  RadioTower,
  Cpu,
  AlertTriangle
} from 'lucide-react';
import { useLiveStream } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { alerts, incidents, miners } = useLiveStream();
  const { user } = useAuth();

  const activeAlertsCount = alerts.filter(a => a.status === 'NEW' || a.status === 'ACKNOWLEDGED').length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;
  const openIncidentsCount = incidents.filter(i => i.status !== 'CLOSED').length;
  const activeSOSCount = miners.filter(m => m.status === 'SOS' || m.status === 'FALL_DETECTED').length;

  const navItems = [
    { id: 'dashboard', label: 'Command Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'map', label: 'Digital Mine Map', icon: Map, badge: activeSOSCount > 0 ? `${activeSOSCount} SOS` : null, badgeColor: 'bg-red-600 animate-pulse' },
    { id: 'zones', label: 'Zone Management', icon: Layers, badge: null },
    { id: 'alerts', label: 'Central Alerts', icon: BellRing, badge: activeAlertsCount > 0 ? activeAlertsCount : null, badgeColor: criticalCount > 0 ? 'bg-red-600 animate-pulse' : 'bg-amber-600' },
    { id: 'rescue', label: 'Rescue Coordination', icon: Ambulance, badge: openIncidentsCount > 0 ? openIncidentsCount : null, badgeColor: 'bg-red-600 animate-pulse' },
    { id: 'users', label: 'Users and Roles', icon: Users, badge: null },
    { id: 'reports', label: 'Reports', icon: FileText, badge: null },
    { id: 'settings', label: 'System & Simulator', icon: Settings, badge: 'DEMO', badgeColor: 'bg-blue-800 text-blue-200' }
  ];

  return (
    <aside className="w-60 border-r border-gray-700 bg-gray-900 flex flex-col justify-between p-3 min-h-[calc(100vh-53px)] select-none">
      <div className="space-y-1">
        <div className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
          Operations Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-sans font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold text-white ${item.badgeColor || 'bg-gray-700'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer System Status Panel */}
      <div className="pt-3 border-t border-gray-800 space-y-2">
        <div className="p-2.5 rounded bg-gray-950 border border-gray-800 text-[11px] font-mono">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="flex items-center gap-1.5">
              <RadioTower className="w-3.5 h-3.5 text-blue-400" />
              <span>Mod 1 AI:</span>
            </span>
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
          <div className="flex items-center justify-between text-gray-400">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Mod 2 Bands:</span>
            </span>
            <span className="text-emerald-400 font-bold">{miners.length} Active</span>
          </div>
        </div>

        <div className="text-[10px] text-center text-gray-500 font-mono">
          MineGuard Command Center v3.4
        </div>
      </div>
    </aside>
  );
}
