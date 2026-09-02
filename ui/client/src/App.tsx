import { useState, useEffect } from 'react';
import { Activity, Layers, GitBranch, Sliders, Shield } from 'lucide-react';
import Dashboard from './components/Dashboard';
import StubsManager from './components/StubsManager';
import ScenariosManager from './components/ScenariosManager';
import AdminActions from './components/AdminActions';
import { presetService } from './services/presetService';

function App() {
  const [activeTab, setActiveTab] = useState('stubs');

  useEffect(() => {
    // Initial fetch of persistent UI config from server / wiremock_data
    presetService.fetchConfig();
  }, []);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Shield size={26} color="#818cf8" />
          <span>WireMock UI</span>
        </div>
        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'stubs' ? 'active' : ''}`}
            onClick={() => setActiveTab('stubs')}
          >
            <Layers size={19} />
            <span>Stubs & Folders</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'scenarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('scenarios')}
          >
            <GitBranch size={19} />
            <span>Scenarios (Stateful)</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={19} />
            <span>Request Journal</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <Sliders size={19} />
            <span>Admin & Presets</span>
          </div>
        </nav>
      </aside>
      
      <main className="main-content">
        {activeTab === 'stubs' && <StubsManager />}
        {activeTab === 'scenarios' && <ScenariosManager />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'admin' && <AdminActions />}
      </main>
    </div>
  );
}

export default App;
