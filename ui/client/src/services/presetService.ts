export interface HeaderPreset {
  id: string;
  name: string;
  key: string;
  value: string;
  matchType?: string; // 'equalTo' | 'contains' | 'matches'
  description?: string;
  category?: 'request' | 'response';
}

export interface FaultTypeDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  enabled: boolean;
  docUrl?: string;
}

export interface UIConfig {
  requestHeaders: HeaderPreset[];
  responseHeaders: HeaderPreset[];
  faultTypes: FaultTypeDefinition[];
  customFolders: string[];
}

export const DEFAULT_REQUEST_HEADERS: HeaderPreset[] = [
  { id: 'req-1', name: 'JSON Content', key: 'Content-Type', value: 'application/json', matchType: 'equalTo', category: 'request', description: 'Standard JSON content' },
  { id: 'req-2', name: 'Accept JSON', key: 'Accept', value: 'application/json', matchType: 'equalTo', category: 'request', description: 'Accept JSON responses' },
  { id: 'req-3', name: 'Bearer Auth', key: 'Authorization', value: 'Bearer .*', matchType: 'matches', category: 'request', description: 'Matches any Bearer token' },
  { id: 'req-4', name: 'API Key', key: 'X-API-Key', value: 'secret-key-123', matchType: 'equalTo', category: 'request', description: 'Custom API Key Header' },
  { id: 'req-5', name: 'User Agent', key: 'User-Agent', value: 'Mozilla/.*', matchType: 'matches', category: 'request', description: 'Browser User-Agent regex' }
];

export const DEFAULT_RESPONSE_HEADERS: HeaderPreset[] = [
  { id: 'res-1', name: 'JSON Content', key: 'Content-Type', value: 'application/json; charset=utf-8', category: 'response', description: 'UTF-8 JSON Content type' },
  { id: 'res-2', name: 'CORS Allow All', key: 'Access-Control-Allow-Origin', value: '*', category: 'response', description: 'Permissive CORS policy' },
  { id: 'res-3', name: 'CORS Methods', key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS', category: 'response', description: 'Allowed HTTP methods' },
  { id: 'res-4', name: 'No Cache', key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate', category: 'response', description: 'Prevents client caching' },
  { id: 'res-5', name: 'Rate Limit Remaining', key: 'X-RateLimit-Remaining', value: '99', category: 'response', description: 'Simulate rate limit status' }
];

export const DEFAULT_FAULTS: FaultTypeDefinition[] = [
  {
    id: 'fault-1',
    code: 'CONNECTION_RESET_BY_PEER',
    name: 'Connection Reset by Peer',
    description: 'Sends garbage data then resets the TCP connection immediately.',
    enabled: true,
    docUrl: 'https://wiremock.org/docs/simulating-faults/'
  },
  {
    id: 'fault-2',
    code: 'EMPTY_RESPONSE',
    name: 'Empty Response',
    description: 'Returns a completely empty response with zero bytes and closes connection.',
    enabled: true,
    docUrl: 'https://wiremock.org/docs/simulating-faults/'
  },
  {
    id: 'fault-3',
    code: 'MALFORMED_RESPONSE_CHUNK',
    name: 'Malformed Response Chunk',
    description: 'Sends valid headers and start of chunked body, then closes prematurely.',
    enabled: true,
    docUrl: 'https://wiremock.org/docs/simulating-faults/'
  },
  {
    id: 'fault-4',
    code: 'RANDOM_DATA_THEN_CLOSE',
    name: 'Random Data then Close',
    description: 'Sends randomized byte streams and then terminates the connection.',
    enabled: true,
    docUrl: 'https://wiremock.org/docs/simulating-faults/'
  },
  {
    id: 'fault-5',
    code: 'PEER_CONNECTION_RESET_THEN_CLOSE',
    name: 'Peer Connection Reset then Close',
    description: 'Simulates peer reset signal before closing socket.',
    enabled: true,
    docUrl: 'https://wiremock.org/docs/simulating-faults/'
  }
];

export const DEFAULT_CUSTOM_FOLDERS: string[] = ['Auth', 'Users', 'Payments', 'Error Simulation'];

let inMemoryConfig: UIConfig = {
  requestHeaders: DEFAULT_REQUEST_HEADERS,
  responseHeaders: DEFAULT_RESPONSE_HEADERS,
  faultTypes: DEFAULT_FAULTS,
  customFolders: DEFAULT_CUSTOM_FOLDERS
};

export const presetService = {
  async fetchConfig(): Promise<UIConfig> {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (data && !data.notFound) {
          inMemoryConfig = {
            requestHeaders: data.requestHeaders || DEFAULT_REQUEST_HEADERS,
            responseHeaders: data.responseHeaders || DEFAULT_RESPONSE_HEADERS,
            faultTypes: data.faultTypes || DEFAULT_FAULTS,
            customFolders: data.customFolders || DEFAULT_CUSTOM_FOLDERS
          };
          this.saveToLocalStorage(inMemoryConfig);
          return inMemoryConfig;
        }
      }
    } catch (err) {
      console.warn('Could not fetch server /api/config, falling back to local cache', err);
    }

    // Fallback to local storage
    const cached = this.loadFromLocalStorage();
    if (cached) {
      inMemoryConfig = cached;
      // Sync back to server if possible
      this.syncToServer(inMemoryConfig);
      return cached;
    }

    return inMemoryConfig;
  },

  async syncToServer(config: UIConfig): Promise<void> {
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config, null, 2)
      });
    } catch (err) {
      console.warn('Could not sync config to /api/config', err);
    }
  },

  loadFromLocalStorage(): UIConfig | null {
    try {
      const raw = localStorage.getItem('wiremock_ui_global_config');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed reading localStorage config', e);
    }
    return null;
  },

  saveToLocalStorage(config: UIConfig) {
    try {
      localStorage.setItem('wiremock_ui_global_config', JSON.stringify(config));
    } catch (e) {
      console.error('Failed saving localStorage config', e);
    }
  },

  async saveConfig(newConfig: Partial<UIConfig>): Promise<UIConfig> {
    inMemoryConfig = {
      ...inMemoryConfig,
      ...newConfig
    };
    this.saveToLocalStorage(inMemoryConfig);
    await this.syncToServer(inMemoryConfig);
    return inMemoryConfig;
  },

  // Request Header Presets
  getRequestHeaders(): HeaderPreset[] {
    return inMemoryConfig.requestHeaders;
  },

  async saveRequestHeaders(headers: HeaderPreset[]) {
    return this.saveConfig({ requestHeaders: headers });
  },

  // Response Header Presets
  getResponseHeaders(): HeaderPreset[] {
    return inMemoryConfig.responseHeaders;
  },

  async saveResponseHeaders(headers: HeaderPreset[]) {
    return this.saveConfig({ responseHeaders: headers });
  },

  // Fault Types
  getFaultTypes(): FaultTypeDefinition[] {
    return inMemoryConfig.faultTypes;
  },

  getActiveFaultTypes(): FaultTypeDefinition[] {
    return inMemoryConfig.faultTypes.filter(f => f.enabled);
  },

  async saveFaultTypes(faults: FaultTypeDefinition[]) {
    return this.saveConfig({ faultTypes: faults });
  },

  // Custom Folders
  getCustomFolders(): string[] {
    return inMemoryConfig.customFolders;
  },

  async saveCustomFolders(folders: string[]) {
    return this.saveConfig({ customFolders: folders });
  },

  // Reset defaults
  async resetAllToDefaults(): Promise<UIConfig> {
    const defaults: UIConfig = {
      requestHeaders: DEFAULT_REQUEST_HEADERS,
      responseHeaders: DEFAULT_RESPONSE_HEADERS,
      faultTypes: DEFAULT_FAULTS,
      customFolders: DEFAULT_CUSTOM_FOLDERS
    };
    return this.saveConfig(defaults);
  }
};
