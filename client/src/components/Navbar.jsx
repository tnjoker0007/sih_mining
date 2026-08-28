import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLiveStream } from '../context/WebSocketContext';
import { 
  ShieldCheck, 
  Radio, 
  Volume2, 
  VolumeX, 
  Bell, 
  AlertTriangle, 
  Clock, 
  Activity, 
  ChevronDown, 
  Flame, 
  RadioTower, 
  AlertOctagon,
  Building2,
  CheckCircle2
} from 'lucide-react';

export default function Navbar({ onOpenEvacuateModal, setActiveTab }) {
  const { user, switchRole, logout } = useAuth();
  const { connected, kpis, alerts, soundMuted, toggleSound, latestBroadcast } = useLiveStream();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;
  const activeAlertsCount = alerts.filter(a => a.status === 'NEW' || a.status === 'ACKNOWLEDGED').length;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-700 bg-gray-900 px-4 py-2 flex items-center justify-between shadow-md">
      {/* 1. Identity & Mine Selector */}
      <div className="flex items-center gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
            MG
          </div>
          <div>
            <div className="font-bold text-sm text-white tracking-wide flex items-center gap-1.5">
              <span>MineGuard Command Center</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-300 border border-blue-700">
                MOD 3
              </span>
            </div>
            <div className="text-[11px] text-gray-400 font-mono">
              Central Operations & Situational Awareness
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-gray-700 hidden md:block"></div>

        {/* Mine Selector */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-800 border border-gray-700 text-xs font-mono text-gray-200">
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-gray-400">Mine:</span>
          <span className="font-semibold text-white">Apex Deep Horizon (MINE_001)</span>
        </div>

        {/* System Health */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-gray-800 border border-gray-700 text-xs font-mono">
          <div className="flex items-center gap-1 text-emerald-400">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}></span>
            <span>{connected ? 'System Health: OK' : 'Reconnecting...'}</span>
          </div>
        </div>
      </div>

      {/* Center Broadcast Banner Alert if Active */}
      {latestBroadcast && (
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-red-950 border border-red-500 text-red-200 text-xs font-mono rounded animate-pulse">
          <AlertOctagon className="w-4 h-4 text-red-400" />
          <span className="font-bold">BROADCAST ACTIVE:</span> {latestBroadcast.message.slice(0, 40)}...
        </div>
      )}

      {/* Right Controls: Clock, Sound, Emergency Evacuation, Alerts, User Profile */}
      <div className="flex items-center gap-2.5">
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-800 border border-gray-700 text-gray-300 font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{time}</span>
        </div>

        {/* Audio Siren Mute Toggle */}
        <button
          onClick={toggleSound}
          title={soundMuted ? 'Unmute Audio Alarms' : 'Mute Audio Alarms'}
          className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 transition-colors"
        >
          {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Notifications / Alerts Pill */}
        <button
          onClick={() => setActiveTab && setActiveTab('alerts')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-mono text-gray-200 transition-colors relative"
        >
          <Bell className="w-3.5 h-3.5 text-amber-400" />
          <span>Alerts</span>
          {activeAlertsCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold text-white ${
              criticalCount > 0 ? 'bg-red-600 animate-pulse' : 'bg-amber-600'
            }`}>
              {activeAlertsCount}
            </span>
          )}
        </button>

        {/* Emergency Evacuation Broadcast Trigger */}
        <button
          onClick={onOpenEvacuateModal}
          className="btn-industrial btn-industrial-danger text-xs font-semibold px-3 py-1 flex items-center gap-1.5 shadow-sm"
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>EVACUATE</span>
        </button>

        {/* User Profile & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-mono text-gray-200 transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
              {user?.role ? user.role.charAt(0) : 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <span className="font-semibold">{user?.full_name?.split(' ')[0] || 'User'}</span>
              <span className="text-[10px] text-blue-400 ml-1">({user?.role?.split(' ')[0] || 'Role'})</span>
            </div>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {/* Role Switcher Menu */}
          {roleMenuOpen && (
            <div 
              className="absolute right-0 mt-2 w-60 rounded-lg bg-gray-900 border border-gray-700 shadow-2xl p-2 z-50 text-xs font-sans"
              onMouseLeave={() => setRoleMenuOpen(false)}
            >
              <div className="px-2 py-1.5 border-b border-gray-800 mb-1">
                <div className="font-semibold text-white">{user?.full_name}</div>
                <div className="text-[11px] text-gray-400 font-mono">{user?.badge_id} • {user?.role}</div>
              </div>

              <div className="text-[10px] text-gray-400 px-2 py-1 uppercase font-mono tracking-wider">Switch Role:</div>
              <button
                onClick={() => { switchRole('Administrator'); setRoleMenuOpen(false); }}
                className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-gray-800 ${user?.role === 'Administrator' ? 'bg-blue-900/40 text-blue-300 font-semibold' : 'text-gray-300'}`}
              >
                <span>Administrator</span>
                {user?.role === 'Administrator' && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
              </button>

              <button
                onClick={() => { switchRole('Control Room Operator'); setRoleMenuOpen(false); }}
                className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-gray-800 ${user?.role === 'Control Room Operator' ? 'bg-blue-900/40 text-blue-300 font-semibold' : 'text-gray-300'}`}
              >
                <span>Control Room Operator</span>
                {user?.role === 'Control Room Operator' && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
              </button>

              <button
                onClick={() => { switchRole('Rescue Team'); setRoleMenuOpen(false); }}
                className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-gray-800 ${user?.role === 'Rescue Team' ? 'bg-blue-900/40 text-blue-300 font-semibold' : 'text-gray-300'}`}
              >
                <span>Rescue Team Lead</span>
                {user?.role === 'Rescue Team' && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
              </button>

              <div className="border-t border-gray-800 mt-1 pt-1">
                <button
                  onClick={() => { logout(); setRoleMenuOpen(false); }}
                  className="w-full text-left px-2 py-1 rounded text-red-400 hover:bg-gray-800 text-[11px] font-mono"
                >
                  Logout Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
