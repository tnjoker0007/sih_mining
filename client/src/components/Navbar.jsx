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
    <header className="sticky top-0 z-50 border-b border-[#1f2d52] bg-gradient-to-b from-[#0d1326]/90 to-[#060913]/95 px-5 py-2.5 flex items-center justify-between shadow-2xl backdrop-blur-md">
      {/* 1. Identity & Mine Selector */}
      <div className="flex items-center gap-5">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[#00f2fe] filter drop-shadow-[0_0_6px_#00f2fe] animate-pulse" />
          <h1 className="font-mono font-black text-sm sm:text-base tracking-wider bg-gradient-to-r from-white to-[#00f2fe] bg-clip-text text-transparent">
            MINEGUARD AI
          </h1>
          <span className="hidden sm:inline-block text-[9px] font-mono px-2 py-0.5 rounded border border-[#1f2d52] bg-white/3 text-[#8c9bb4]">
            COMMAND CENTER
          </span>
        </div>

        <div className="h-6 w-px bg-[#1f2d52] hidden md:block"></div>

        {/* Mine Selector */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0d1326] border border-[#1f2d52] text-[11px] font-mono text-[#8c9bb4]">
          <Building2 className="w-3.5 h-3.5 text-[#00f2fe]" />
          <span>Mine:</span>
          <select className="bg-transparent text-[#f0f4f8] font-bold border-none outline-none cursor-pointer">
            <option value="MINE_001" className="bg-[#0d1326]">MINE_001 (Underground Coal)</option>
            <option value="MINE_002" className="bg-[#0d1326]">MINE_002 (Open Pit Iron)</option>
          </select>
        </div>

        {/* LoRa Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0d1326] border border-[#1f2d52] text-[11px] font-mono text-[#8c9bb4]">
          <Radio className="w-3.5 h-3.5 text-[#39ff14]" />
          <span>LoRa: <strong className="text-[#39ff14]">915 MHz (OK)</strong></span>
        </div>
      </div>

      {/* Center Broadcast Banner Alert if Active */}
      {latestBroadcast && (
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-red-950 border border-[#ff3366] text-[#ff3366] text-xs font-mono rounded animate-pulse">
          <AlertOctagon className="w-4 h-4 text-[#ff3366]" />
          <span className="font-bold">EVACUATION WARNING:</span> {latestBroadcast.message.slice(0, 40)}...
        </div>
      )}

      {/* Right Controls: Clock, Sound, Emergency Evacuation, Alerts, User Profile */}
      <div className="flex items-center gap-3">
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0d1326] border border-[#1f2d52] text-[#8c9bb4] font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-[#4facfe]" />
          <span>{time}</span>
        </div>

        {/* Audio Siren Mute Toggle */}
        <button
          onClick={toggleSound}
          title={soundMuted ? 'Unmute Audio Alarms' : 'Mute Audio Alarms'}
          className="p-1.5 rounded bg-[#0d1326] hover:bg-[#151d36] border border-[#1f2d52] text-gray-300 transition-colors"
        >
          {soundMuted ? <VolumeX className="w-4 h-4 text-[#ff3366]" /> : <Volume2 className="w-4 h-4 text-[#39ff14]" />}
        </button>

        {/* Notifications / Alerts Pill */}
        <button
          onClick={() => setActiveTab && setActiveTab('alerts')}
          className="relative p-2 rounded bg-[#0d1326] hover:bg-[#151d36] border border-[#1f2d52] text-[#8c9bb4] hover:text-white transition-colors"
        >
          <Bell className="w-4 h-4" />
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ff3366] text-[#060913] flex items-center justify-center text-[9px] font-black font-mono border border-[#060913] animate-pulse">
              {activeAlertsCount}
            </span>
          )}
        </button>

        {/* Emergency Evacuation Broadcast Trigger */}
        <button
          onClick={onOpenEvacuateModal}
          className="btn-industrial btn-industrial-danger text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 shadow-sm"
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>EVACUATE</span>
        </button>

        {/* User Profile & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0d1326] hover:bg-[#151d36] border border-[#1f2d52] text-xs font-mono text-[#f0f4f8] transition-colors"
          >
            <div className="w-5.5 h-5.5 rounded-full bg-[#4facfe] text-[#060913] flex items-center justify-center font-bold text-[10px]">
              {user?.role === 'Administrator' ? 'AD' : user?.role === 'Rescue Team' ? 'RE' : 'OP'}
            </div>
            <div className="text-left hidden sm:block">
              <span className="font-semibold">{user?.badge_id || 'OP_SEC_02'}</span>
            </div>
            <ChevronDown className="w-3 h-3 text-[#8c9bb4]" />
          </button>

          {/* Role Switcher Menu */}
          {roleMenuOpen && (
            <div 
              className="absolute right-0 mt-2 w-60 rounded-lg bg-[#0d1326] border border-[#1f2d52] shadow-2xl p-2 z-50 text-xs font-sans text-[#f0f4f8]"
              onMouseLeave={() => setRoleMenuOpen(false)}
            >
              <div className="px-2 py-1.5 border-b border-[#1f2d52] mb-1">
                <div className="font-semibold text-white">{user?.full_name}</div>
                <div className="text-[11px] text-[#8c9bb4] font-mono">{user?.badge_id} • {user?.role}</div>
              </div>

              <div className="text-[10px] text-[#8c9bb4] px-2 py-1 uppercase font-mono tracking-wider">Switch Role:</div>
              <button
                onClick={() => { switchRole('Administrator'); setRoleMenuOpen(false); setActiveTab && setActiveTab('users'); }}
                className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-[#151d36] ${user?.role === 'Administrator' ? 'bg-[#4facfe]/15 text-[#4facfe] font-semibold' : 'text-gray-300'}`}
              >
                <span>Administrator</span>
                {user?.role === 'Administrator' && <CheckCircle2 className="w-3 h-3 text-[#4facfe]" />}
              </button>

              <button
                onClick={() => { switchRole('Control Room Operator'); setRoleMenuOpen(false); setActiveTab && setActiveTab('dashboard'); }}
                className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-[#151d36] ${user?.role === 'Control Room Operator' ? 'bg-[#4facfe]/15 text-[#4facfe] font-semibold' : 'text-gray-300'}`}
              >
                <span>Control Room Operator</span>
                {user?.role === 'Control Room Operator' && <CheckCircle2 className="w-3 h-3 text-[#4facfe]" />}
              </button>

              <button
                onClick={() => { switchRole('Rescue Team'); setRoleMenuOpen(false); setActiveTab && setActiveTab('rescue'); }}
                className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-[#151d36] ${user?.role === 'Rescue Team' ? 'bg-[#4facfe]/15 text-[#4facfe] font-semibold' : 'text-gray-300'}`}
              >
                <span>Rescue Team Lead</span>
                {user?.role === 'Rescue Team' && <CheckCircle2 className="w-3 h-3 text-[#4facfe]" />}
              </button>

              <div className="border-t border-[#1f2d52] mt-1 pt-1">
                <button
                  onClick={() => { logout(); setRoleMenuOpen(false); }}
                  className="w-full text-left px-2 py-1 rounded text-[#ff3366] hover:bg-[#151d36] text-[11px] font-mono"
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
