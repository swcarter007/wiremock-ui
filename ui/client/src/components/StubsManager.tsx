import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Folder,
  FolderPlus,
  Copy,
  Edit2,
  Search,
  ArrowUp,
  ArrowDown,
  GitBranch,
  ShieldAlert,
  ChevronDown,
  X,
  Code,
  Tag
} from 'lucide-react';
import { wiremockApi, type WiremockStub } from '../services/wiremockApi';
import { presetService, type HeaderPreset, type FaultTypeDefinition } from '../services/presetService';

type FieldMatch = {
  id: number;
  key: string;
  matchType: string;
  value: string;
};

type HeaderDefinition = {
  id: number;
  key: string;
  value: string;
};

export default function StubsManager() {
  const [stubs, setStubs] = useState<WiremockStub[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState('ALL');
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Active presets & faults
  const [reqPresets, setReqPresets] = useState<HeaderPreset[]>([]);
  const [resPresets, setResPresets] = useState<HeaderPreset[]>([]);
  const [activeFaults, setActiveFaults] = useState<FaultTypeDefinition[]>([]);

  // Editor Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStubId, setEditingStubId] = useState<string | null>(null);

  // Form State
  const [stubName, setStubName] = useState('');
  const [stubPriority, setStubPriority] = useState<number>(5);
  const [stubFolder, setStubFolder] = useState('');
  const [requestMethod, setRequestMethod] = useState('GET');
  const [urlMatchType, setUrlMatchType] = useState('urlPath');
  const [urlPath, setUrlPath] = useState('');

  const [headers, setHeaders] = useState<FieldMatch[]>([]);
  const [queryParams, setQueryParams] = useState<FieldMatch[]>([]);

  // Response Mode: 'normal' vs 'fault'
  const [responseMode, setResponseMode] = useState<'normal' | 'fault'>('normal');
  const [selectedFault, setSelectedFault] = useState<string>('CONNECTION_RESET_BY_PEER');

  // Normal Response fields
  const [responseStatus, setResponseStatus] = useState(200);
  const [responseBody, setResponseBody] = useState('');
  const [responseDelay, setResponseDelay] = useState(0);
  const [responseHeaders, setResponseHeaders] = useState<HeaderDefinition[]>([]);

  // Scenario fields
  const [isScenarioEnabled, setIsScenarioEnabled] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [requiredScenarioState, setRequiredScenarioState] = useState('');
  const [newScenarioState, setNewScenarioState] = useState('');

  // Dropdown UI toggles
  const [showReqPresetDropdown, setShowReqPresetDropdown] = useState(false);
  const [showResPresetDropdown, setShowResPresetDropdown] = useState(false);
  const reqDropdownRef = useRef<HTMLDivElement>(null);
  const resDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      await presetService.fetchConfig();
      setCustomFolders(presetService.getCustomFolders());
      setReqPresets(presetService.getRequestHeaders());
      setResPresets(presetService.getResponseHeaders());
      setActiveFaults(presetService.getActiveFaultTypes());
      loadStubs();
    };
    init();
  }, []);

  // Close preset dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (reqDropdownRef.current && !reqDropdownRef.current.contains(e.target as Node)) {
        setShowReqPresetDropdown(false);
      }
      if (resDropdownRef.current && !resDropdownRef.current.contains(e.target as Node)) {
        setShowResPresetDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadStubs = async () => {
    setLoading(true);
    try {
      const data = await wiremockApi.getMappings(500);
      setStubs(data.mappings || []);
    } catch (err) {
      console.error('Failed to load mappings', err);
    }
    setLoading(false);
  };

  // Folder Management
  const handleAddFolder = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    if (!customFolders.includes(trimmed)) {
      const next = [...customFolders, trimmed];
      setCustomFolders(next);
      presetService.saveCustomFolders(next);
    }
    setSelectedFolder(trimmed);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleDeleteFolder = (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete folder "${folderName}"? Stubs inside will become Uncategorized.`)) return;
    const next = customFolders.filter(f => f !== folderName);
    setCustomFolders(next);
    presetService.saveCustomFolders(next);
    if (selectedFolder === folderName) setSelectedFolder('ALL');
  };

  // Get all unique folders from stubs + custom folders
  const allFolders = Array.from(
    new Set([
      ...customFolders,
      ...stubs.map(s => s.metadata?.folder).filter((f): f is string => Boolean(f))
    ])
  ).sort();

  // Reset form to clean state
  const resetForm = () => {
    setEditingStubId(null);
    setStubName('');
    setStubPriority(5);
    setStubFolder(selectedFolder !== 'ALL' && selectedFolder !== 'UNCATEGORIZED' ? selectedFolder : '');
    setRequestMethod('GET');
    setUrlMatchType('urlPath');
    setUrlPath('');
    setHeaders([]);
    setQueryParams([]);
    setResponseMode('normal');
    setSelectedFault(activeFaults[0]?.code || 'CONNECTION_RESET_BY_PEER');
    setResponseStatus(200);
    setResponseBody('');
    setResponseDelay(0);
    setResponseHeaders([]);
    setIsScenarioEnabled(false);
    setScenarioName('');
    setRequiredScenarioState('');
    setNewScenarioState('');
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (stub: WiremockStub) => {
    setEditingStubId(stub.id || stub.uuid || null);
    setStubName(stub.name || '');
    setStubPriority(stub.priority !== undefined ? stub.priority : 5);
    setStubFolder(stub.metadata?.folder || '');
    setRequestMethod(stub.request.method || 'GET');

    // URL match
    if (stub.request.url) {
      setUrlMatchType('url');
      setUrlPath(stub.request.url);
    } else if (stub.request.urlPath) {
      setUrlMatchType('urlPath');
      setUrlPath(stub.request.urlPath);
    } else if (stub.request.urlPattern) {
      setUrlMatchType('urlPattern');
      setUrlPath(stub.request.urlPattern);
    } else if (stub.request.urlPathPattern) {
      setUrlMatchType('urlPathPattern');
      setUrlPath(stub.request.urlPathPattern);
    } else {
      setUrlMatchType('urlPath');
      setUrlPath('');
    }

    // Request Headers
    if (stub.request.headers) {
      const parsedH: FieldMatch[] = Object.entries(stub.request.headers).map(([key, val], idx) => {
        if (typeof val === 'object' && val !== null) {
          const matchKey = Object.keys(val)[0] || 'equalTo';
          return { id: Date.now() + idx, key, matchType: matchKey, value: String(val[matchKey]) };
        }
        return { id: Date.now() + idx, key, matchType: 'equalTo', value: String(val) };
      });
      setHeaders(parsedH);
    } else {
      setHeaders([]);
    }

    // Query Params
    if (stub.request.queryParameters) {
      const parsedQ: FieldMatch[] = Object.entries(stub.request.queryParameters).map(([key, val], idx) => {
        if (typeof val === 'object' && val !== null) {
          const matchKey = Object.keys(val)[0] || 'equalTo';
          return { id: Date.now() + idx, key, matchType: matchKey, value: String(val[matchKey]) };
        }
        return { id: Date.now() + idx, key, matchType: 'equalTo', value: String(val) };
      });
      setQueryParams(parsedQ);
    } else {
      setQueryParams([]);
    }

    // Response vs Fault
    if (stub.response.fault) {
      setResponseMode('fault');
      setSelectedFault(stub.response.fault);
      setResponseStatus(200);
      setResponseBody('');
      setResponseDelay(0);
      setResponseHeaders([]);
    } else {
      setResponseMode('normal');
      setResponseStatus(stub.response.status || 200);
      setResponseBody(stub.response.body || (stub.response.jsonBody ? JSON.stringify(stub.response.jsonBody, null, 2) : ''));
      setResponseDelay(stub.response.fixedDelayMilliseconds || 0);

      if (stub.response.headers) {
        setResponseHeaders(
          Object.entries(stub.response.headers).map(([key, value], idx) => ({
            id: Date.now() + idx,
            key,
            value: String(value)
          }))
        );
      } else {
        setResponseHeaders([]);
      }
    }

    // Scenario
    if (stub.scenarioName) {
      setIsScenarioEnabled(true);
      setScenarioName(stub.scenarioName);
      setRequiredScenarioState(stub.requiredScenarioState || '');
      setNewScenarioState(stub.newScenarioState || '');
    } else {
      setIsScenarioEnabled(false);
      setScenarioName('');
      setRequiredScenarioState('');
      setNewScenarioState('');
    }

    setIsModalOpen(true);
  };

  const handleDuplicateStub = (stub: WiremockStub) => {
    const clone: WiremockStub = JSON.parse(JSON.stringify(stub));
    delete clone.id;
    delete clone.uuid;
    clone.name = clone.name ? `${clone.name} (Copy)` : 'Copy of Stub';
    handleOpenEditModal(clone);
    setEditingStubId(null); // save as new
  };

  const handleDeleteStub = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stub?')) return;
    try {
      await wiremockApi.deleteMapping(id);
      await loadStubs();
    } catch (err) {
      alert('Failed to delete stub');
    }
  };

  // Priority adjustments
  const handleUpdatePriority = async (stub: WiremockStub, delta: number) => {
    const id = stub.id || stub.uuid;
    if (!id) return;
    const current = stub.priority !== undefined ? stub.priority : 5;
    const nextPriority = Math.max(1, current + delta);
    if (nextPriority === current) return;

    const updated = { ...stub, priority: nextPriority };
    try {
      await wiremockApi.updateMapping(id, updated);
      await loadStubs();
    } catch (err) {
      alert('Failed to update priority');
    }
  };


  // Header and Param builders
  const addHeader = (key = '', matchType = 'equalTo', value = '') => {
    setHeaders([...headers, { id: Date.now(), key, matchType, value }]);
  };
  const removeHeader = (id: number) => setHeaders(headers.filter(h => h.id !== id));

  const addQueryParam = () => setQueryParams([...queryParams, { id: Date.now(), key: '', matchType: 'equalTo', value: '' }]);
  const removeQueryParam = (id: number) => setQueryParams(queryParams.filter(q => q.id !== id));

  const addResponseHeader = (key = '', value = '') => {
    setResponseHeaders([...responseHeaders, { id: Date.now(), key, value }]);
  };
  const removeResponseHeader = (id: number) => setResponseHeaders(responseHeaders.filter(h => h.id !== id));

  // Preset quick insert
  const handleInsertReqPreset = (preset: HeaderPreset) => {
    addHeader(preset.key, preset.matchType || 'equalTo', preset.value);
    setShowReqPresetDropdown(false);
  };

  const handleInsertResPreset = (preset: HeaderPreset) => {
    addResponseHeader(preset.key, preset.value);
    setShowResPresetDropdown(false);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(responseBody);
      setResponseBody(JSON.stringify(parsed, null, 2));
    } catch (e) {
      alert('Invalid JSON format');
    }
  };

  // Save Stub
  const handleSaveStub = async () => {
    if (!urlPath.trim()) {
      alert('Please specify a URL Path or Pattern');
      return;
    }

    const payload: WiremockStub = {
      name: stubName.trim() || undefined,
      priority: Number(stubPriority) || 5,
      request: {
        method: requestMethod,
        [urlMatchType]: urlPath.trim()
      },
      response: {}
    };

    // Metadata folder
    if (stubFolder.trim()) {
      payload.metadata = {
        folder: stubFolder.trim()
      };
    }

    // Scenario
    if (isScenarioEnabled && scenarioName.trim()) {
      payload.scenarioName = scenarioName.trim();
      if (requiredScenarioState.trim()) {
        payload.requiredScenarioState = requiredScenarioState.trim();
      }
      if (newScenarioState.trim()) {
        payload.newScenarioState = newScenarioState.trim();
      }
    }

    // Request Headers
    if (headers.length > 0) {
      payload.request.headers = {};
      headers.forEach(h => {
        if (h.key.trim()) {
          payload.request.headers![h.key.trim()] = { [h.matchType]: h.value };
        }
      });
    }

    // Query Params
    if (queryParams.length > 0) {
      payload.request.queryParameters = {};
      queryParams.forEach(q => {
        if (q.key.trim()) {
          payload.request.queryParameters![q.key.trim()] = { [q.matchType]: q.value };
        }
      });
    }

    // Response definition
    if (responseMode === 'fault') {
      payload.response = {
        fault: selectedFault
      };
    } else {
      payload.response = {
        status: Number(responseStatus) || 200,
        body: responseBody
      };

      if (responseDelay > 0) {
        payload.response.fixedDelayMilliseconds = Number(responseDelay);
      }

      if (responseHeaders.length > 0) {
        payload.response.headers = {};
        responseHeaders.forEach(h => {
          if (h.key.trim()) {
            payload.response.headers![h.key.trim()] = h.value;
          }
        });
      }
    }

    try {
      if (editingStubId) {
        await wiremockApi.updateMapping(editingStubId, payload);
      } else {
        await wiremockApi.createMapping(payload);
      }
      // Auto persist to disk
      try {
        await wiremockApi.saveMappingsToDisk();
      } catch (e) {
        console.warn('Could not auto-save to disk', e);
      }

      setIsModalOpen(false);
      await loadStubs();
    } catch (err: any) {
      console.error(err);
      alert(`Failed to save stub: ${err.message || 'Unknown error'}`);
    }
  };

  // Filter Stubs
  const filteredStubs = stubs.filter(stub => {
    // Folder filter
    if (selectedFolder === 'UNCATEGORIZED') {
      if (stub.metadata?.folder) return false;
    } else if (selectedFolder !== 'ALL') {
      if (stub.metadata?.folder !== selectedFolder) return false;
    }

    // Method filter
    if (selectedMethodFilter !== 'ALL') {
      if ((stub.request.method || 'ANY') !== selectedMethodFilter) return false;
    }

    // Search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const path = (stub.request.url || stub.request.urlPath || stub.request.urlPattern || stub.request.urlPathPattern || '').toLowerCase();
      const name = (stub.name || '').toLowerCase();
      const scenario = (stub.scenarioName || '').toLowerCase();
      const fault = (stub.response.fault || '').toLowerCase();
      return path.includes(term) || name.includes(term) || scenario.includes(term) || fault.includes(term);
    }

    return true;
  }).sort((a, b) => {
    // Sort primarily by priority (1 is highest), then by path
    const priA = a.priority !== undefined ? a.priority : 5;
    const priB = b.priority !== undefined ? b.priority : 5;
    return priA - priB;
  });

  const getFolderCount = (folderName: string) => {
    if (folderName === 'ALL') return stubs.length;
    if (folderName === 'UNCATEGORIZED') return stubs.filter(s => !s.metadata?.folder).length;
    return stubs.filter(s => s.metadata?.folder === folderName).length;
  };

  return (
    <div>
      <div className="header-controls">
        <div>
          <h1>Stubs & Folder Explorer</h1>
          <p>Organize requests into folders, manage priority ordering, configure fault simulation, and stateful scenarios.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={16} /> New Stub
          </button>
        </div>
      </div>

      {/* Explorer Layout */}
      <div className="explorer-layout">
        {/* Folder Sidebar */}
        <aside className="folder-sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Folders
            </span>
            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.2rem 0.45rem' }}
              onClick={() => setIsCreatingFolder(!isCreatingFolder)}
              title="Add New Folder"
            >
              <FolderPlus size={14} />
            </button>
          </div>

          {isCreatingFolder && (
            <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '4px' }}>
              <input
                type="text"
                placeholder="Folder name..."
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddFolder()}
                autoFocus
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
              />
              <button className="btn btn-primary btn-sm" onClick={handleAddFolder}>
                Add
              </button>
            </div>
          )}

          <div
            className={`folder-item ${selectedFolder === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedFolder('ALL')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Folder size={16} />
              <span>All Stubs</span>
            </div>
            <span className="folder-count">{getFolderCount('ALL')}</span>
          </div>

          <div
            className={`folder-item ${selectedFolder === 'UNCATEGORIZED' ? 'active' : ''}`}
            onClick={() => setSelectedFolder('UNCATEGORIZED')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Folder size={16} style={{ opacity: 0.6 }} />
              <span>Uncategorized</span>
            </div>
            <span className="folder-count">{getFolderCount('UNCATEGORIZED')}</span>
          </div>

          {allFolders.map(folder => (
            <div
              key={folder}
              className={`folder-item ${selectedFolder === folder ? 'active' : ''}`}
              onClick={() => setSelectedFolder(folder)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Folder size={16} color="#f59e0b" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="folder-count">{getFolderCount(folder)}</span>
                <span
                  style={{ display: 'inline-flex', cursor: 'pointer', opacity: 0.5 }}
                  onClick={e => handleDeleteFolder(folder, e)}
                  title="Remove folder"
                >
                  <Trash2 size={12} />
                </span>
              </div>
            </div>
          ))}
        </aside>

        {/* Stubs Main List */}
        <div className="stubs-content">
          <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative', minWidth: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by URL path, name, scenario, or fault..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '2rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Method:</span>
                <select
                  value={selectedMethodFilter}
                  onChange={e => setSelectedMethodFilter(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="ALL">All Methods</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Loading stubs...
              </div>
            ) : filteredStubs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <p>No stubs match the current filter or folder.</p>
                <button className="btn btn-primary" onClick={handleOpenCreateModal}>
                  <Plus size={16} /> Create New Stub
                </button>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '100px' }}>Priority</th>
                      <th>Method & Path</th>
                      <th>Folder</th>
                      <th>State / Fault</th>
                      <th>Response</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStubs.map(stub => {
                      const id = stub.id || stub.uuid || '';
                      const path = stub.request.url || stub.request.urlPath || stub.request.urlPattern || stub.request.urlPathPattern || '/';
                      const pri = stub.priority !== undefined ? stub.priority : 5;

                      return (
                        <tr key={id}>
                          {/* Priority Column with Reorder Controls */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span className={`priority-badge ${pri <= 2 ? 'priority-high' : ''}`} title={`Priority: ${pri} (1 is highest)`}>
                                P: {pri}
                              </span>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <button
                                  className="btn btn-sm"
                                  style={{ padding: '1px 3px', height: '14px', lineHeight: 1 }}
                                  title="Increase Priority (lower number)"
                                  onClick={() => handleUpdatePriority(stub, -1)}
                                  disabled={pri <= 1}
                                >
                                  <ArrowUp size={10} />
                                </button>
                                <button
                                  className="btn btn-sm"
                                  style={{ padding: '1px 3px', height: '14px', lineHeight: 1 }}
                                  title="Decrease Priority (higher number)"
                                  onClick={() => handleUpdatePriority(stub, 1)}
                                >
                                  <ArrowDown size={10} />
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Method & Path */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className={`method-badge method-${stub.request.method || 'ANY'}`}>
                                {stub.request.method || 'ANY'}
                              </span>
                              <strong style={{ fontFamily: 'monospace', fontSize: '0.88rem' }}>{path}</strong>
                            </div>
                            {stub.name && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {stub.name}
                              </div>
                            )}
                          </td>

                          {/* Folder */}
                          <td>
                            {stub.metadata?.folder ? (
                              <span className="folder-badge">
                                <Folder size={11} /> {stub.metadata.folder}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                            )}
                          </td>

                          {/* State / Fault Column */}
                          <td>
                            {stub.response.fault ? (
                              <span className="fault-badge">
                                <ShieldAlert size={12} /> {stub.response.fault}
                              </span>
                            ) : stub.scenarioName ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span className="scenario-badge">
                                  <GitBranch size={11} /> {stub.scenarioName}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  [{stub.requiredScenarioState || 'Started'}] → [{stub.newScenarioState || 'Stay'}]
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Standard</span>
                            )}
                          </td>

                          {/* Response Status */}
                          <td>
                            {stub.response.fault ? (
                              <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Fault Simulated</span>
                            ) : (
                              <span className={`status-badge status-${(stub.response.status || 200) >= 500 ? '5xx' : (stub.response.status || 200) >= 400 ? '4xx' : '2xx'}`}>
                                {stub.response.status || 200}
                              </span>
                            )}
                            {stub.response.fixedDelayMilliseconds ? (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {stub.response.fixedDelayMilliseconds}ms delay
                              </div>
                            ) : null}
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                              <button
                                className="btn btn-sm"
                                onClick={() => handleOpenEditModal(stub)}
                                title="Edit Stub"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                className="btn btn-sm"
                                onClick={() => handleDuplicateStub(stub)}
                                title="Duplicate Stub"
                              >
                                <Copy size={13} />
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteStub(id)}
                                title="Delete Stub"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE / EDIT STUB MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingStubId ? 'Edit Stub Mapping' : 'Create New Stub Mapping'}</h2>
              <button className="btn btn-sm" onClick={() => setIsModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {/* General Info & Metadata */}
              <div className="card card-subtle" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Stub Name / Label (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Get User Profile Success"
                      value={stubName}
                      onChange={e => setStubName(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Priority (1 = Highest)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={stubPriority}
                      onChange={e => setStubPriority(parseInt(e.target.value) || 5)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Folder Group</label>
                    <input
                      type="text"
                      list="folder-list-datalist"
                      placeholder="Select or enter folder"
                      value={stubFolder}
                      onChange={e => setStubFolder(e.target.value)}
                    />
                    <datalist id="folder-list-datalist">
                      {allFolders.map(f => (
                        <option key={f} value={f} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Request Matching */}
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <h3>Request Matching</h3>
                <div className="dynamic-row">
                  <div className="form-group" style={{ flex: '0 0 140px', marginBottom: 0 }}>
                    <label>Method</label>
                    <select value={requestMethod} onChange={e => setRequestMethod(e.target.value)}>
                      <option>ANY</option>
                      <option>GET</option>
                      <option>POST</option>
                      <option>PUT</option>
                      <option>DELETE</option>
                      <option>PATCH</option>
                      <option>OPTIONS</option>
                      <option>HEAD</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: '0 0 160px', marginBottom: 0 }}>
                    <label>URL Match Type</label>
                    <select value={urlMatchType} onChange={e => setUrlMatchType(e.target.value)}>
                      <option value="urlPath">URL Path (Exact)</option>
                      <option value="urlPathPattern">URL Path Pattern (Regex)</option>
                      <option value="url">Exact URL (with query)</option>
                      <option value="urlPattern">URL Pattern (Regex)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Path / Pattern</label>
                    <input
                      type="text"
                      placeholder="/api/v1/users/.*"
                      value={urlPath}
                      onChange={e => setUrlPath(e.target.value)}
                    />
                  </div>
                </div>

                {/* Request Headers with Preset Selector */}
                <div style={{ marginTop: '1.25rem' }}>
                  <div className="header-controls" style={{ marginBottom: '0.5rem' }}>
                    <label style={{ margin: 0 }}>Request Headers</label>
                    <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
                      {/* Presets Dropdown */}
                      <div ref={reqDropdownRef} style={{ position: 'relative' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setShowReqPresetDropdown(!showReqPresetDropdown)}
                        >
                          <Tag size={13} /> Add from Preset <ChevronDown size={13} />
                        </button>

                        {showReqPresetDropdown && (
                          <div className="preset-dropdown-menu">
                            {reqPresets.map(preset => (
                              <div
                                key={preset.id}
                                className="preset-dropdown-item"
                                onClick={() => handleInsertReqPreset(preset)}
                              >
                                <strong>{preset.name}</strong>
                                <span>{preset.key}: {preset.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button type="button" className="btn btn-sm" onClick={() => addHeader()}>
                        <Plus size={14} /> Custom Header
                      </button>
                    </div>
                  </div>

                  {headers.map((h, i) => (
                    <div className="dynamic-row" key={h.id}>
                      <input
                        type="text"
                        placeholder="Header Name (e.g. Authorization)"
                        value={h.key}
                        onChange={e => {
                          const next = [...headers];
                          next[i].key = e.target.value;
                          setHeaders(next);
                        }}
                      />
                      <select
                        value={h.matchType}
                        style={{ flex: '0 0 140px' }}
                        onChange={e => {
                          const next = [...headers];
                          next[i].matchType = e.target.value;
                          setHeaders(next);
                        }}
                      >
                        <option value="equalTo">Equals</option>
                        <option value="contains">Contains</option>
                        <option value="matches">Matches Regex</option>
                        <option value="doesNotMatch">Does Not Match</option>
                        <option value="absent">Is Absent</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Value to match"
                        value={h.value}
                        onChange={e => {
                          const next = [...headers];
                          next[i].value = e.target.value;
                          setHeaders(next);
                        }}
                      />
                      <button className="btn btn-danger btn-remove" onClick={() => removeHeader(h.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {headers.length === 0 && <p style={{ fontSize: '0.8rem', fontStyle: 'italic', margin: 0 }}>No request headers required.</p>}
                </div>

                {/* Query Parameters */}
                <div style={{ marginTop: '1.25rem' }}>
                  <div className="header-controls" style={{ marginBottom: '0.5rem' }}>
                    <label style={{ margin: 0 }}>Query Parameters</label>
                    <button type="button" className="btn btn-sm" onClick={addQueryParam}>
                      <Plus size={14} /> Add Query Param
                    </button>
                  </div>
                  {queryParams.map((q, i) => (
                    <div className="dynamic-row" key={q.id}>
                      <input
                        type="text"
                        placeholder="Param Name (e.g. page)"
                        value={q.key}
                        onChange={e => {
                          const next = [...queryParams];
                          next[i].key = e.target.value;
                          setQueryParams(next);
                        }}
                      />
                      <select
                        value={q.matchType}
                        style={{ flex: '0 0 140px' }}
                        onChange={e => {
                          const next = [...queryParams];
                          next[i].matchType = e.target.value;
                          setQueryParams(next);
                        }}
                      >
                        <option value="equalTo">Equals</option>
                        <option value="contains">Contains</option>
                        <option value="matches">Matches Regex</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Value"
                        value={q.value}
                        onChange={e => {
                          const next = [...queryParams];
                          next[i].value = e.target.value;
                          setQueryParams(next);
                        }}
                      />
                      <button className="btn btn-danger btn-remove" onClick={() => removeQueryParam(q.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Response Definition & Faults Mode Switch */}
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>Response Definition</h3>

                  {/* Mode switch */}
                  <div style={{ display: 'flex', gap: '4px', background: '#111827', padding: '3px', borderRadius: '0.5rem' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${responseMode === 'normal' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setResponseMode('normal')}
                    >
                      Standard Response
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${responseMode === 'fault' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ background: responseMode === 'fault' ? 'var(--danger)' : undefined }}
                      onClick={() => setResponseMode('fault')}
                    >
                      <ShieldAlert size={14} /> Simulate Fault
                    </button>
                  </div>
                </div>

                {/* Fault Simulation Mode */}
                {responseMode === 'fault' ? (
                  <div className="card card-subtle" style={{ border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                    <div className="form-group">
                      <label style={{ color: '#fca5a5' }}>Preconfigured Fault Type</label>
                      <select
                        value={selectedFault}
                        onChange={e => setSelectedFault(e.target.value)}
                        style={{ borderColor: 'rgba(239, 68, 68, 0.6)' }}
                      >
                        {activeFaults.map(f => (
                          <option key={f.code} value={f.code}>
                            {f.name} ({f.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '0.5rem' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#fca5a5' }}>
                        <strong>Behavior:</strong> {activeFaults.find(f => f.code === selectedFault)?.description || 'Simulates network level fault'}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Standard Response Form */
                  <div>
                    <div className="dynamic-row">
                      <div className="form-group" style={{ flex: '0 0 140px', marginBottom: 0 }}>
                        <label>HTTP Status</label>
                        <input
                          type="number"
                          value={responseStatus}
                          onChange={e => setResponseStatus(parseInt(e.target.value) || 200)}
                        />
                      </div>
                      <div className="form-group" style={{ flex: '0 0 160px', marginBottom: 0 }}>
                        <label>Fixed Delay (ms)</label>
                        <input
                          type="number"
                          value={responseDelay}
                          onChange={e => setResponseDelay(parseInt(e.target.value) || 0)}
                          placeholder="0 ms"
                        />
                      </div>
                    </div>

                    {/* Response Headers */}
                    <div style={{ marginTop: '1.25rem' }}>
                      <div className="header-controls" style={{ marginBottom: '0.5rem' }}>
                        <label style={{ margin: 0 }}>Response Headers</label>
                        <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
                          {/* Response Presets Dropdown */}
                          <div ref={resDropdownRef} style={{ position: 'relative' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setShowResPresetDropdown(!showResPresetDropdown)}
                            >
                              <Tag size={13} /> Add from Preset <ChevronDown size={13} />
                            </button>

                            {showResPresetDropdown && (
                              <div className="preset-dropdown-menu">
                                {resPresets.map(preset => (
                                  <div
                                    key={preset.id}
                                    className="preset-dropdown-item"
                                    onClick={() => handleInsertResPreset(preset)}
                                  >
                                    <strong>{preset.name}</strong>
                                    <span>{preset.key}: {preset.value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <button type="button" className="btn btn-sm" onClick={() => addResponseHeader()}>
                            <Plus size={14} /> Custom Header
                          </button>
                        </div>
                      </div>

                      {responseHeaders.map((h, i) => (
                        <div className="dynamic-row" key={h.id}>
                          <input
                            type="text"
                            placeholder="Header Key (e.g. Content-Type)"
                            value={h.key}
                            onChange={e => {
                              const next = [...responseHeaders];
                              next[i].key = e.target.value;
                              setResponseHeaders(next);
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Value"
                            value={h.value}
                            onChange={e => {
                              const next = [...responseHeaders];
                              next[i].value = e.target.value;
                              setResponseHeaders(next);
                            }}
                          />
                          <button className="btn btn-danger btn-remove" onClick={() => removeResponseHeader(h.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Response Body */}
                    <div style={{ marginTop: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <label style={{ margin: 0 }}>Response Body</label>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={handleFormatJson}>
                          <Code size={13} /> Format JSON
                        </button>
                      </div>
                      <textarea
                        placeholder='{"message": "success"}'
                        value={responseBody}
                        onChange={e => setResponseBody(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Stateful Scenarios Section */}
              <div className="card" style={{ border: isScenarioEnabled ? '1px solid var(--purple)' : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isScenarioEnabled ? '1rem' : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GitBranch size={18} color="#a855f7" />
                    <h3 style={{ margin: 0 }}>Stateful Scenario</h3>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={isScenarioEnabled}
                      onChange={e => setIsScenarioEnabled(e.target.checked)}
                      style={{ width: 'auto' }}
                    />
                    <span>Enable Scenario</span>
                  </label>
                </div>

                {isScenarioEnabled && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Scenario Name</label>
                      <input
                        type="text"
                        placeholder="e.g. UserLifecycle, CheckoutFlow"
                        value={scenarioName}
                        onChange={e => setScenarioName(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Required State to Match</label>
                      <input
                        type="text"
                        placeholder="Started (default initial state)"
                        value={requiredScenarioState}
                        onChange={e => setRequiredScenarioState(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>New State (Transition)</label>
                      <input
                        type="text"
                        placeholder="e.g. Processing, Completed"
                        value={newScenarioState}
                        onChange={e => setNewScenarioState(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveStub}>
                <Save size={16} /> Save Mapping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
