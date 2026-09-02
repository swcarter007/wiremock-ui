import { useState, useEffect } from 'react';
import { Save, RotateCcw, Plus, Trash2, Edit2, Check, X, ShieldAlert, Sliders, Database, FileText } from 'lucide-react';
import { wiremockApi } from '../services/wiremockApi';
import { presetService, type HeaderPreset, type FaultTypeDefinition } from '../services/presetService';

export default function AdminActions() {
  const [activeSubTab, setActiveSubTab] = useState<'system' | 'headers' | 'faults'>('system');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Headers State
  const [reqHeaders, setReqHeaders] = useState<HeaderPreset[]>([]);
  const [resHeaders, setResHeaders] = useState<HeaderPreset[]>([]);
  const [editingHeader, setEditingHeader] = useState<HeaderPreset | null>(null);
  const [newHeaderCategory, setNewHeaderCategory] = useState<'request' | 'response'>('request');
  const [isAddingHeader, setIsAddingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState<Partial<HeaderPreset>>({
    name: '',
    key: '',
    value: '',
    matchType: 'equalTo',
    description: ''
  });

  // Faults State
  const [faults, setFaults] = useState<FaultTypeDefinition[]>([]);
  const [editingFault, setEditingFault] = useState<FaultTypeDefinition | null>(null);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    const config = await presetService.fetchConfig();
    setReqHeaders(config.requestHeaders);
    setResHeaders(config.responseHeaders);
    setFaults(config.faultTypes);
  };

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // System actions
  const handleSaveToDisk = async () => {
    setSaving(true);
    try {
      await wiremockApi.saveMappingsToDisk();
      showFeedback('State successfully saved to mapped disk volume!', 'success');
    } catch (err) {
      console.error(err);
      showFeedback('Failed to save state to disk.', 'error');
    }
    setSaving(false);
  };

  const handleResetMappings = async () => {
    if (!confirm('Are you sure you want to reset mappings to default files?')) return;
    try {
      await wiremockApi.resetMappings();
      showFeedback('Mappings reset successfully!', 'success');
    } catch (err) {
      showFeedback('Failed to reset mappings.', 'error');
    }
  };

  const handleResetJournal = async () => {
    if (!confirm('Clear all recorded request logs from the journal?')) return;
    try {
      await wiremockApi.resetJournal();
      showFeedback('Request journal cleared!', 'success');
    } catch (err) {
      showFeedback('Failed to reset journal.', 'error');
    }
  };

  const handleResetScenarios = async () => {
    try {
      await wiremockApi.resetScenarios();
      showFeedback('All scenarios reset to "Started" state!', 'success');
    } catch (err) {
      showFeedback('Failed to reset scenarios.', 'error');
    }
  };

  // Header Preset Actions
  const handleSaveHeaderPreset = () => {
    if (!headerForm.name || !headerForm.key) {
      alert('Please provide a Name and Header Key');
      return;
    }

    if (editingHeader) {
      // Update
      const updated: HeaderPreset = {
        ...editingHeader,
        name: headerForm.name || '',
        key: headerForm.key || '',
        value: headerForm.value || '',
        matchType: headerForm.matchType || 'equalTo',
        description: headerForm.description || ''
      };

      if (editingHeader.category === 'request') {
        const next = reqHeaders.map(h => (h.id === updated.id ? updated : h));
        setReqHeaders(next);
        presetService.saveRequestHeaders(next);
      } else {
        const next = resHeaders.map(h => (h.id === updated.id ? updated : h));
        setResHeaders(next);
        presetService.saveResponseHeaders(next);
      }
      setEditingHeader(null);
    } else {
      // Create
      const newPreset: HeaderPreset = {
        id: `preset-${Date.now()}`,
        name: headerForm.name || '',
        key: headerForm.key || '',
        value: headerForm.value || '',
        matchType: headerForm.matchType || 'equalTo',
        category: newHeaderCategory,
        description: headerForm.description || ''
      };

      if (newHeaderCategory === 'request') {
        const next = [...reqHeaders, newPreset];
        setReqHeaders(next);
        presetService.saveRequestHeaders(next);
      } else {
        const next = [...resHeaders, newPreset];
        setResHeaders(next);
        presetService.saveResponseHeaders(next);
      }
      setIsAddingHeader(false);
    }

    setHeaderForm({ name: '', key: '', value: '', matchType: 'equalTo', description: '' });
    showFeedback('Header preset saved!', 'success');
  };

  const handleDeleteHeaderPreset = (id: string, category: 'request' | 'response') => {
    if (!confirm('Delete this header preset?')) return;
    if (category === 'request') {
      const next = reqHeaders.filter(h => h.id !== id);
      setReqHeaders(next);
      presetService.saveRequestHeaders(next);
    } else {
      const next = resHeaders.filter(h => h.id !== id);
      setResHeaders(next);
      presetService.saveResponseHeaders(next);
    }
    showFeedback('Header preset removed.', 'success');
  };

  const handleStartEditHeader = (preset: HeaderPreset) => {
    setEditingHeader(preset);
    setIsAddingHeader(false);
    setHeaderForm({
      name: preset.name,
      key: preset.key,
      value: preset.value,
      matchType: preset.matchType || 'equalTo',
      description: preset.description || ''
    });
  };

  // Fault Actions
  const handleToggleFault = (id: string) => {
    const next = faults.map(f => (f.id === id ? { ...f, enabled: !f.enabled } : f));
    setFaults(next);
    presetService.saveFaultTypes(next);
    showFeedback('Fault status updated.', 'success');
  };

  const handleSaveFaultEdit = () => {
    if (!editingFault) return;
    const next = faults.map(f => (f.id === editingFault.id ? editingFault : f));
    setFaults(next);
    presetService.saveFaultTypes(next);
    setEditingFault(null);
    showFeedback('Fault definition updated.', 'success');
  };

  const handleRestoreAllDefaults = () => {
    if (!confirm('Reset all presets, custom headers, and fault configs to original factory defaults?')) return;
    presetService.resetAllToDefaults();
    loadPresets();
    showFeedback('All presets and fault settings restored to defaults.', 'success');
  };

  return (
    <div>
      <div className="header-controls">
        <div>
          <h1>Admin & Configuration</h1>
          <p>Configure dynamic header presets, customize fault definitions, and manage WireMock server persistence.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleRestoreAllDefaults}>
          <RotateCcw size={14} /> Restore All Defaults
        </button>
      </div>

      {message && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.25rem',
          background: message.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
          color: message.type === 'success' ? '#34d399' : '#f87171',
          border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {message.type === 'success' ? <Check size={18} /> : <ShieldAlert size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Sub tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeSubTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('system')}
        >
          <Database size={16} /> Server & Persistence
        </button>
        <button
          className={`tab-btn ${activeSubTab === 'headers' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('headers')}
        >
          <Sliders size={16} /> Preset Headers
        </button>
        <button
          className={`tab-btn ${activeSubTab === 'faults' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('faults')}
        >
          <ShieldAlert size={16} /> Fault Types
        </button>
      </div>

      {/* System Tab */}
      {activeSubTab === 'system' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          <div className="card">
            <h3><Save size={18} style={{ verticalAlign: 'middle', marginRight: '6px', color: 'var(--primary)' }} /> Disk Persistence</h3>
            <p>Write all currently registered in-memory stub mappings to the mapped disk volume (<code>/home/wiremock/mappings</code>).</p>
            <button className="btn btn-primary" onClick={handleSaveToDisk} disabled={saving}>
              {saving ? 'Saving...' : 'Save Stubs to Disk'}
            </button>
          </div>

          <div className="card">
            <h3><RotateCcw size={18} style={{ verticalAlign: 'middle', marginRight: '6px', color: 'var(--purple)' }} /> Reset Scenarios</h3>
            <p>Reset all active scenario state machines back to their default <code>Started</code> state.</p>
            <button className="btn btn-secondary" onClick={handleResetScenarios}>
              Reset All Scenarios
            </button>
          </div>

          <div className="card">
            <h3><FileText size={18} style={{ verticalAlign: 'middle', marginRight: '6px', color: 'var(--info)' }} /> Clear Journal</h3>
            <p>Clear all recorded request history logs from WireMock memory.</p>
            <button className="btn btn-secondary" onClick={handleResetJournal}>
              Clear Request Journal
            </button>
          </div>

          <div className="card">
            <h3><Trash2 size={18} style={{ verticalAlign: 'middle', marginRight: '6px', color: 'var(--danger)' }} /> Reload Mappings</h3>
            <p>Reset and reload mappings from the persistent disk storage.</p>
            <button className="btn btn-danger" onClick={handleResetMappings}>
              Reload Mappings
            </button>
          </div>
        </div>
      )}

      {/* Preset Headers Tab */}
      {activeSubTab === 'headers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ margin: 0 }}>
              Define preconfigured request & response headers. These appear as quick 1-click presets in the Stubs Manager.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingHeader(null);
                setIsAddingHeader(true);
                setHeaderForm({ name: '', key: '', value: '', matchType: 'equalTo', description: '' });
              }}
            >
              <Plus size={16} /> Add Preset Header
            </button>
          </div>

          {/* Modal / Inline Add/Edit Form */}
          {(isAddingHeader || editingHeader) && (
            <div className="card card-subtle" style={{ border: '1px solid var(--primary)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>{editingHeader ? 'Edit Header Preset' : 'Add New Header Preset'}</h3>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    setIsAddingHeader(false);
                    setEditingHeader(null);
                  }}
                >
                  <X size={14} /> Cancel
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {!editingHeader && (
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={newHeaderCategory}
                      onChange={e => setNewHeaderCategory(e.target.value as 'request' | 'response')}
                    >
                      <option value="request">Request Header</option>
                      <option value="response">Response Header</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Preset Label Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Bearer Token, CORS Allow All"
                    value={headerForm.name}
                    onChange={e => setHeaderForm({ ...headerForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Header Key</label>
                  <input
                    type="text"
                    placeholder="e.g. Authorization, Content-Type"
                    value={headerForm.key}
                    onChange={e => setHeaderForm({ ...headerForm, key: e.target.value })}
                  />
                </div>

                {(editingHeader?.category === 'request' || (!editingHeader && newHeaderCategory === 'request')) && (
                  <div className="form-group">
                    <label>Match Type (Request)</label>
                    <select
                      value={headerForm.matchType}
                      onChange={e => setHeaderForm({ ...headerForm, matchType: e.target.value })}
                    >
                      <option value="equalTo">Equals (equalTo)</option>
                      <option value="contains">Contains</option>
                      <option value="matches">Regex Match (matches)</option>
                      <option value="doesNotMatch">Does Not Match</option>
                      <option value="absent">Absent</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Default Value</label>
                  <input
                    type="text"
                    placeholder="e.g. application/json, Bearer .*"
                    value={headerForm.value}
                    onChange={e => setHeaderForm({ ...headerForm, value: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Description / Usage Notes</label>
                  <input
                    type="text"
                    placeholder="Optional description"
                    value={headerForm.description}
                    onChange={e => setHeaderForm({ ...headerForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="btn btn-primary" onClick={handleSaveHeaderPreset}>
                  <Check size={16} /> Save Preset
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Request Headers */}
            <div className="card">
              <h3>Request Header Presets ({reqHeaders.length})</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name / Key</th>
                      <th>Match & Value</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reqHeaders.map(h => (
                      <tr key={h.id}>
                        <td>
                          <strong>{h.name}</strong>
                          <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{h.key}</div>
                        </td>
                        <td>
                          <span className="tag-badge">{h.matchType || 'equalTo'}</span>
                          <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', marginTop: '3px' }}>{h.value || '—'}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="btn btn-sm" onClick={() => handleStartEditHeader(h)} title="Edit">
                              <Edit2 size={13} />
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteHeaderPreset(h.id, 'request')} title="Delete">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Response Headers */}
            <div className="card">
              <h3>Response Header Presets ({resHeaders.length})</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name / Key</th>
                      <th>Value</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resHeaders.map(h => (
                      <tr key={h.id}>
                        <td>
                          <strong>{h.name}</strong>
                          <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{h.key}</div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{h.value || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="btn btn-sm" onClick={() => handleStartEditHeader(h)} title="Edit">
                              <Edit2 size={13} />
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteHeaderPreset(h.id, 'response')} title="Delete">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fault Types Tab */}
      {activeSubTab === 'faults' && (
        <div>
          <p>
            Configure the types of faults available when building stubs. You can customize labels, descriptions, and enable or disable specific fault simulations.
          </p>

          {editingFault && (
            <div className="card card-subtle" style={{ border: '1px solid var(--primary)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Edit Fault Definition ({editingFault.code})</h3>
                <button className="btn btn-sm" onClick={() => setEditingFault(null)}>
                  <X size={14} /> Cancel
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Display Name</label>
                  <input
                    type="text"
                    value={editingFault.name}
                    onChange={e => setEditingFault({ ...editingFault, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>WireMock Fault Code (Read Only)</label>
                  <input type="text" value={editingFault.code} disabled />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Description & Behavioral Notes</label>
                  <textarea
                    value={editingFault.description}
                    onChange={e => setEditingFault({ ...editingFault, description: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={handleSaveFaultEdit}>
                  <Check size={16} /> Save Changes
                </button>
              </div>
            </div>
          )}

          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Fault Code</th>
                    <th>Display Name</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {faults.map(f => (
                    <tr key={f.id} style={{ opacity: f.enabled ? 1 : 0.6 }}>
                      <td>
                        <button
                          className={`btn btn-sm ${f.enabled ? 'btn-success' : 'btn-secondary'}`}
                          onClick={() => handleToggleFault(f.id)}
                        >
                          {f.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>
                      <td>
                        <span className="fault-badge">{f.code}</span>
                      </td>
                      <td>
                        <strong>{f.name}</strong>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {f.description}
                      </td>
                      <td>
                        <button className="btn btn-sm" onClick={() => setEditingFault(f)}>
                          <Edit2 size={13} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
