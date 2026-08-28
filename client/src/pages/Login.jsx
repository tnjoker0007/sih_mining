import React, { useState } from 'react';
import { ShieldAlert, Lock, User, ArrowRight, Radio, Activity, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onLoginSuccess }) {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const res = await login(username, password);
    if (res.success) {
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setError(res.message || 'Login failed');
    }
  };

  const handleQuickDemoLogin = async (role) => {
    setError(null);
    const res = await login(null, null, role);
    if (res.success && onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070a12] p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="glass-panel w-full max-w-md p-8 rounded-2xl border border-white/15 shadow-2xl relative z-10 space-y-6">
        {/* Logo and Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 text-cyan-400 shadow-[0_0_25px_rgba(0,242,254,0.3)]">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wider">
            MINEGUARD AI
          </h1>
          <p className="text-xs font-mono text-cyan-300">
            MODULE 3: COMMAND CENTER & RESCUE OPERATIONS
          </p>
          <p className="text-[11px] font-mono text-slate-400">
            Low-Cost Real-Time Mine Subsidence Monitoring & Smart Band Early Warning System
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/60 text-xs font-mono text-red-300 text-center">
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-slate-400 mb-1">Username / Badge ID:</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-control pl-9 text-xs"
                placeholder="Enter username..."
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Password:</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-control pl-9 text-xs"
                placeholder="Enter password..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full text-xs font-display flex items-center justify-center gap-2 py-2.5 shadow-[0_0_15px_rgba(0,242,254,0.3)]"
          >
            <span>{loading ? 'AUTHENTICATING...' : 'ACCESS COMMAND CENTER'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Role Selectors */}
        <div className="space-y-2 pt-2 border-t border-white/10 font-mono text-xs">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 text-center">
            Evaluation Quick-Login:
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickDemoLogin('Administrator')}
              className="p-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/50 text-slate-300 hover:text-white flex items-center justify-between text-[11px]"
            >
              <span>👑 Administrator</span>
              <span className="text-[10px] text-cyan-400">Chief Inspector Pendelton</span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('Control Room Operator')}
              className="p-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/50 text-slate-300 hover:text-white flex items-center justify-between text-[11px]"
            >
              <span>📡 Control Room Operator</span>
              <span className="text-[10px] text-cyan-400">Maya Lin (Lead)</span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('Rescue Team')}
              className="p-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/50 text-slate-300 hover:text-white flex items-center justify-between text-[11px]"
            >
              <span>🚑 Rescue Team</span>
              <span className="text-[10px] text-cyan-400">Capt. Gabriel Reyes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
