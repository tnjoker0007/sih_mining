import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Radio, 
  Heart, 
  Activity, 
  Plus, 
  Trash2, 
  Edit3,
  BadgeAlert
} from 'lucide-react';
import { useLiveStream } from '../context/WebSocketContext';
import { fetchApi } from '../utils/api';

export default function UserManagement() {
  const { miners, zones, refreshAll } = useLiveStream();
  const [usersList, setUsersList] = useState([]);
  const [activeTabSub, setActiveTabSub] = useState('MINERS'); // 'MINERS' or 'USERS'

  const [newMinerModalOpen, setNewMinerModalOpen] = useState(false);
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);

  // New Miner Form
  const [minerName, setMinerName] = useState('');
  const [minerRole, setMinerRole] = useState('Continuous Miner Operator');
  const [minerZone, setMinerZone] = useState('ZONE_A');
  const [minerBlood, setMinerBlood] = useState('O+');
  const [minerContact, setMinerContact] = useState('+1-555-0199');

  // New System User Form
  const [userName, setUserName] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userRole, setUserRole] = useState('Control Room Operator');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    fetchApi('/users')
      .then(res => res.data && setUsersList(res.data))
      .catch(console.error);
  }, []);

  const handleCreateMiner = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/miners', {
        method: 'POST',
        body: JSON.stringify({
          name: minerName,
          role_title: minerRole,
          zone_id: minerZone,
          blood_group: minerBlood,
          emergency_contact: minerContact
        })
      });
      await refreshAll();
      setNewMinerModalOpen(false);
      setMinerName('');
    } catch (err) {
      alert('Error adding miner: ' + err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/users', {
        method: 'POST',
        body: JSON.stringify({
          username: userName,
          full_name: userFullName,
          role: userRole,
          email: userEmail
        })
      });
      const res = await fetchApi('/users');
      if (res.data) setUsersList(res.data);
      setNewUserModalOpen(false);
      setUserName('');
      setUserFullName('');
    } catch (err) {
      alert('Error creating user: ' + err.message);
    }
  };

  const handleDeleteMiner = async (id) => {
    if (!window.confirm('Are you sure you want to delete this miner profile? This will also unpair their assigned smart band.')) {
      return;
    }
    try {
      await fetchApi(`/miners/${id}`, { method: 'DELETE' });
      await refreshAll();
    } catch (err) {
      alert('Error deleting miner: ' + err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this command user account?')) {
      return;
    }
    try {
      await fetchApi(`/users/${id}`, { method: 'DELETE' });
      const res = await fetchApi('/users');
      if (res.data) setUsersList(res.data);
    } catch (err) {
      alert('Error deleting user: ' + err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/90 border border-white/10 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              RBAC & PERSONNEL
            </span>
            <span className="text-xs font-mono text-slate-400">Section 2 & 10 Directory</span>
          </div>
          <h1 className="text-xl font-display font-bold text-white tracking-wider mt-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            PERSONNEL & USER ADMINISTRATION
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Manage Underground Miners (Smart Bands) and Command Center RBAC Accounts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-950 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setActiveTabSub('MINERS')}
              className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                activeTabSub === 'MINERS' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Miners ({miners.length})
            </button>
            <button
              onClick={() => setActiveTabSub('USERS')}
              className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                activeTabSub === 'USERS' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Command Users ({usersList.length})
            </button>
          </div>

          {activeTabSub === 'MINERS' ? (
            <button
              onClick={() => setNewMinerModalOpen(true)}
              className="btn btn-primary btn-sm text-xs flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>ENROLL MINER & BAND</span>
            </button>
          ) : (
            <button
              onClick={() => setNewUserModalOpen(true)}
              className="btn btn-primary btn-sm text-xs flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>CREATE USER ACCOUNT</span>
            </button>
          )}
        </div>
      </div>

      {activeTabSub === 'MINERS' ? (
        /* Miners Roster Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
          {miners.map((m) => {
            const isDanger = m.status === 'SOS' || m.status === 'FALL_DETECTED';

            return (
              <div
                key={m.id}
                className={`glass-panel p-5 rounded-xl border space-y-3 ${
                  isDanger ? 'border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 font-bold border border-cyan-500/30">
                      {m.code}
                    </span>
                    <span className={`badge ${isDanger ? 'badge-critical' : 'badge-safe'}`}>
                      {m.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">
                      BAND: <strong className="text-purple-300">{m.assigned_band_id || 'UNASSIGNED'}</strong>
                    </span>
                    <button
                      onClick={() => handleDeleteMiner(m.id)}
                      title="Delete Miner Profile"
                      className="p-1 rounded text-[#ff3366] hover:bg-[#ff3366]/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-display font-bold text-white">
                    {m.name}
                  </h3>
                  <div className="text-[11px] text-slate-400">{m.role_title}</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-white/5 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Zone:</span>
                    <span className="text-cyan-300 font-semibold">{m.zone_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Blood Group:</span>
                    <span className="text-slate-200">{m.blood_group}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Emergency Contact:</span>
                    <span className="text-slate-300">{m.emergency_contact}</span>
                  </div>
                </div>

                {/* Vitals preview */}
                <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                  <div className="p-2 rounded bg-black/40 border border-white/5">
                    <div className="text-slate-500 text-[10px]">HEART RATE</div>
                    <div className="font-bold text-slate-100">{m.vitals?.heart_rate || '--'} BPM</div>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-white/5">
                    <div className="text-slate-500 text-[10px]">SPO2 OXYGEN</div>
                    <div className="font-bold text-slate-100">{m.vitals?.spo2 || '--'}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Users Table */
        <div className="glass-panel rounded-xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/90 text-slate-400 font-display uppercase tracking-wider text-[11px]">
                <th className="p-3.5">User ID</th>
                <th className="p-3.5">Full Name</th>
                <th className="p-3.5">Username</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Badge ID</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-bold text-cyan-300">{u.id}</td>
                  <td className="p-3.5 font-display font-semibold text-slate-200">{u.full_name}</td>
                  <td className="p-3.5 text-slate-300">{u.username}</td>
                  <td className="p-3.5">
                    <span className="badge badge-purple text-[10px]">{u.role}</span>
                  </td>
                  <td className="p-3.5 text-slate-400">{u.badge_id}</td>
                  <td className="p-3.5 text-slate-400">{u.email}</td>
                  <td className="p-3.5">
                    <span className="badge badge-safe text-[10px]">ACTIVE</span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      title="Delete User Account"
                      className="p-1.5 rounded text-[#ff3366] hover:bg-[#ff3366]/10 transition-colors inline-flex items-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Enroll Miner Modal */}
      {newMinerModalOpen && (
        <div className="modal-backdrop">
          <div className="glass-panel w-full max-w-lg p-6 rounded-xl relative text-slate-100 shadow-2xl">
            <h2 className="text-lg font-display font-bold text-white tracking-wider mb-4 border-b border-white/10 pb-3">
              ENROLL MINER & PAIR SMART BAND
            </h2>
            <form onSubmit={handleCreateMiner} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Miner Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Vance"
                  value={minerName}
                  onChange={(e) => setMinerName(e.target.value)}
                  className="input-control"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Operational Role:</label>
                  <input
                    type="text"
                    value={minerRole}
                    onChange={(e) => setMinerRole(e.target.value)}
                    className="input-control"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Assigned Zone:</label>
                  <select
                    value={minerZone}
                    onChange={(e) => setMinerZone(e.target.value)}
                    className="select-control w-full"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.code} - {z.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Blood Group:</label>
                  <select
                    value={minerBlood}
                    onChange={(e) => setMinerBlood(e.target.value)}
                    className="select-control w-full"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Emergency Contact Phone:</label>
                  <input
                    type="text"
                    value={minerContact}
                    onChange={(e) => setMinerContact(e.target.value)}
                    className="input-control"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewMinerModalOpen(false)}
                  className="btn btn-outline btn-sm text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm text-xs"
                >
                  Enroll & Auto-Pair Band
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Account Modal */}
      {newUserModalOpen && (
        <div className="modal-backdrop">
          <div className="glass-panel w-full max-w-lg p-6 rounded-xl relative text-slate-100 shadow-2xl">
            <h2 className="text-lg font-display font-bold text-white tracking-wider mb-4 border-b border-white/10 pb-3">
              PROVISION COMMAND RBAC USER ACCOUNT
            </h2>
            <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">User Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Officer Liam Vance"
                  value={userFullName}
                  onChange={(e) => setUserFullName(e.target.value)}
                  className="input-control"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Username:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. lvance"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="input-control"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">System Role:</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="select-control w-full"
                  >
                    <option value="Control Room Operator">Control Room Operator</option>
                    <option value="Rescue Team">Rescue Team</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address:</label>
                <input
                  type="email"
                  placeholder="lvance@mineguard.ai"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="input-control"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewUserModalOpen(false)}
                  className="btn btn-outline btn-sm text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm text-xs"
                >
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
