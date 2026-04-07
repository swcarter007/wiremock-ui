import { useState } from 'react';
import { Activity, LayoutDashboard, Settings } from 'lucide-react';
import Dashboard from './components/Dashboard';
import StubsManager from './components/StubsManager';
import AdminActions from './components/AdminActions';
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Activity size={24} />
          WireMock UI
        </div>
        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            Journal
          </div>
          <div 
            className={`nav-item ${activeTab === 'stubs' ? 'active' : ''}`}
            onClick={() => setActiveTab('stubs')}
          >
            <Settings size={20} />
            Stubs
          </div>
          <div 
            className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <Activity size={20} />
            Admin
          </div>
        </nav>
      </aside>
      
      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'stubs' && <StubsManager />}
        {activeTab === 'admin' && <AdminActions />}
      </main>
    </div>
  )
}

export default App
