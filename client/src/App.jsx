import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import EvacuationModal from './components/EvacuationModal';

import Dashboard from './pages/Dashboard';
import MineMap from './pages/MineMap';
import ZoneManagement from './pages/ZoneManagement';
import Alerts from './pages/Alerts';
import Rescue from './pages/Rescue';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Analytics from './pages/Analytics';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [evacuateModalOpen, setEvacuateModalOpen] = useState(false);

  if (!user) {
    return <Login onLoginSuccess={() => setActiveTab('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <Navbar onOpenEvacuateModal={() => setEvacuateModalOpen(true)} setActiveTab={setActiveTab} />

      {/* Main Command Center Layout */}
      <div className="flex-1 flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 bg-[var(--bg-app)] overflow-y-auto max-h-[calc(100vh-61px)]">
          {activeTab === 'dashboard' && (
            <Dashboard 
              setActiveTab={setActiveTab} 
              onOpenEvacuateModal={() => setEvacuateModalOpen(true)} 
            />
          )}
          {activeTab === 'map' && (
            <MineMap 
              onOpenEvacuateModal={() => setEvacuateModalOpen(true)} 
            />
          )}
          {activeTab === 'zones' && <ZoneManagement />}
          {activeTab === 'alerts' && <Alerts setActiveTab={setActiveTab} />}
          {activeTab === 'rescue' && (
            <Rescue onOpenEvacuateModal={() => setEvacuateModalOpen(true)} />
          )}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'settings' && <Settings />}
          {activeTab === 'analytics' && <Analytics />}
        </main>
      </div>

      {/* Global Mass Evacuation Modal */}
      <EvacuationModal
        isOpen={evacuateModalOpen}
        onClose={() => setEvacuateModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <MainApp />
      </WebSocketProvider>
    </AuthProvider>
  );
}
