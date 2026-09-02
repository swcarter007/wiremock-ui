import { useEffect, useState } from 'react';
import { RefreshCw, RotateCcw, GitBranch, Layers, CheckCircle2 } from 'lucide-react';
import { wiremockApi, type ScenarioItem, type WiremockStub } from '../services/wiremockApi';

export default function ScenariosManager() {
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [mappings, setMappings] = useState<WiremockStub[]>([]);
  const [loading, setLoading] = useState(false);
  const [customStateInputs, setCustomStateInputs] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [scenariosRes, mappingsRes] = await Promise.all([
        wiremockApi.getScenarios(),
        wiremockApi.getMappings(200)
      ]);
      setScenarios(scenariosRes.scenarios || []);
      setMappings(mappingsRes.mappings || []);
    } catch (err) {
      console.error('Failed to fetch scenarios data', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResetAll = async () => {
    if (!confirm('Are you sure you want to reset all scenarios to their initial "Started" state?')) return;
    try {
      await wiremockApi.resetScenarios();
      alert('All scenarios have been reset to "Started" state!');
      await fetchData();
    } catch (err) {
      alert('Failed to reset scenarios');
    }
  };

  const handleSetState = async (scenarioName: string, state: string) => {
    setUpdating(scenarioName);
    try {
      await wiremockApi.setScenarioState(scenarioName, state);
      await fetchData();
    } catch (err) {
      alert(`Failed to set state for scenario ${scenarioName}`);
    }
    setUpdating(null);
  };

  return (
    <div>
      <div className="header-controls">
        <div>
          <h1>Stateful Scenarios</h1>
          <p>Inspect active WireMock state machines, monitor transitions, and reset scenario states.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn" onClick={fetchData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Refresh
          </button>
          <button className="btn btn-danger" onClick={handleResetAll} disabled={loading}>
            <RotateCcw size={16} /> Reset All Scenarios
          </button>
        </div>
      </div>

      {scenarios.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <GitBranch size={48} style={{ opacity: 0.4, marginBottom: '1rem', color: 'var(--purple)' }} />
          <h3>No Active Scenarios Found</h3>
          <p style={{ maxWidth: '500px', margin: '0 auto' }}>
            Scenarios are created automatically when you define stubs with a <strong>Scenario Name</strong> and state transitions in the Stubs Manager.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {scenarios.map(sc => {
            const relatedStubs = mappings.filter(m => m.scenarioName === sc.name);
            const currentStateInput = customStateInputs[sc.name] || '';

            return (
              <div key={sc.id || sc.name} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <GitBranch size={20} color="#a855f7" />
                      <h2 style={{ margin: 0 }}>{sc.name}</h2>
                    </div>
                    <p style={{ marginTop: '0.25rem', marginBottom: 0 }}>
                      Current State: <span className="scenario-badge" style={{ fontSize: '0.85rem' }}>{sc.state}</span>
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <select
                      value={sc.state}
                      onChange={e => handleSetState(sc.name, e.target.value)}
                      disabled={updating === sc.name}
                      style={{ width: 'auto', minWidth: '150px' }}
                    >
                      <option value={sc.state}>State: {sc.state}</option>
                      {sc.possibleStates
                        ?.filter(s => s !== sc.state)
                        .map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      <option value="Started">Started (Initial)</option>
                    </select>

                    <button
                      className="btn btn-secondary btn-sm"
                      title="Reset this scenario to Started"
                      onClick={() => handleSetState(sc.name, 'Started')}
                      disabled={updating === sc.name}
                    >
                      <RotateCcw size={14} /> Reset
                    </button>
                  </div>
                </div>

                {/* State modifier custom input */}
                <div className="dynamic-row" style={{ maxWidth: '400px', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Enter custom state name..."
                    value={currentStateInput}
                    onChange={e => setCustomStateInputs({ ...customStateInputs, [sc.name]: e.target.value })}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: '0 0 auto' }}
                    onClick={() => {
                      if (currentStateInput.trim()) {
                        handleSetState(sc.name, currentStateInput.trim());
                        setCustomStateInputs({ ...customStateInputs, [sc.name]: '' });
                      }
                    }}
                    disabled={!currentStateInput.trim() || updating === sc.name}
                  >
                    Set State
                  </button>
                </div>

                {/* Related Stubs in this Scenario */}
                <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={16} /> Configured Transitions ({relatedStubs.length} Stubs)
                </h4>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Required State</th>
                        <th>Request Match</th>
                        <th>Response / Status</th>
                        <th>New State (Transition)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatedStubs.map((st, i) => {
                        const path = st.request.url || st.request.urlPath || st.request.urlPattern || st.request.urlPathPattern || '/';
                        const isCurrentlyActive = st.requiredScenarioState === sc.state || (!st.requiredScenarioState && sc.state === 'Started');

                        return (
                          <tr key={st.id || i} style={{ background: isCurrentlyActive ? 'rgba(168, 85, 247, 0.08)' : undefined }}>
                            <td>
                              <span className="tag-badge">
                                {st.requiredScenarioState || 'Started (Default)'}
                              </span>
                              {isCurrentlyActive && (
                                <span style={{ marginLeft: '6px', color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
                                  <CheckCircle2 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />
                                  Active Match
                                </span>
                              )}
                            </td>
                            <td>
                              <span className={`method-badge method-${st.request.method || 'ANY'}`} style={{ marginRight: '6px' }}>
                                {st.request.method || 'ANY'}
                              </span>
                              <code style={{ fontSize: '0.85rem' }}>{path}</code>
                            </td>
                            <td>
                              {st.response.fault ? (
                                <span className="fault-badge">{st.response.fault}</span>
                              ) : (
                                <span className={`status-badge status-${(st.response.status || 200) >= 400 ? '4xx' : '2xx'}`}>
                                  {st.response.status || 200}
                                </span>
                              )}
                            </td>
                            <td>
                              {st.newScenarioState ? (
                                <span className="scenario-badge">→ {st.newScenarioState}</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No change</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
