export interface WiremockStub {
  id?: string;
  uuid?: string;
  name?: string;
  priority?: number;
  request: {
    method?: string;
    url?: string;
    urlPath?: string;
    urlPattern?: string;
    urlPathPattern?: string;
    headers?: Record<string, any>;
    queryParameters?: Record<string, any>;
    bodyPatterns?: Array<Record<string, any>>;
  };
  response: {
    status?: number;
    body?: string;
    jsonBody?: any;
    headers?: Record<string, string>;
    fixedDelayMilliseconds?: number;
    fault?: string;
  };
  scenarioName?: string;
  requiredScenarioState?: string;
  newScenarioState?: string;
  metadata?: {
    folder?: string;
    tags?: string[];
    [key: string]: any;
  };
  persistent?: boolean;
}

export interface ScenarioItem {
  id: string;
  name: string;
  state: string;
  possibleStates: string[];
  mappings?: WiremockStub[];
}

export const wiremockApi = {
  // Mappings
  async getMappings(limit = 200, offset = 0): Promise<{ mappings: WiremockStub[]; meta: any }> {
    const res = await fetch(`/__admin/mappings?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error(`Failed to fetch mappings: ${res.statusText}`);
    return res.json();
  },

  async getMapping(id: string): Promise<WiremockStub> {
    const res = await fetch(`/__admin/mappings/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch mapping ${id}: ${res.statusText}`);
    return res.json();
  },

  async createMapping(stub: WiremockStub): Promise<WiremockStub> {
    const res = await fetch('/__admin/mappings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stub)
    });
    if (!res.ok) throw new Error(`Failed to create mapping: ${res.statusText}`);
    return res.json();
  },

  async updateMapping(id: string, stub: WiremockStub): Promise<WiremockStub> {
    const res = await fetch(`/__admin/mappings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stub)
    });
    if (!res.ok) throw new Error(`Failed to update mapping: ${res.statusText}`);
    return res.json();
  },

  async deleteMapping(id: string): Promise<void> {
    const res = await fetch(`/__admin/mappings/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`Failed to delete mapping: ${res.statusText}`);
  },

  async resetMappings(): Promise<void> {
    const res = await fetch('/__admin/mappings/reset', { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to reset mappings: ${res.statusText}`);
  },

  async saveMappingsToDisk(): Promise<void> {
    const res = await fetch('/__admin/mappings/save', { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to save mappings to disk: ${res.statusText}`);
  },

  // Scenarios
  async getScenarios(): Promise<{ scenarios: ScenarioItem[] }> {
    const res = await fetch('/__admin/scenarios');
    if (!res.ok) throw new Error(`Failed to fetch scenarios: ${res.statusText}`);
    return res.json();
  },

  async resetScenarios(): Promise<void> {
    const res = await fetch('/__admin/scenarios/reset', { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to reset scenarios: ${res.statusText}`);
  },

  async setScenarioState(scenarioName: string, state: string): Promise<void> {
    const res = await fetch(`/__admin/scenarios/${encodeURIComponent(scenarioName)}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state })
    });
    if (!res.ok) throw new Error(`Failed to update scenario state: ${res.statusText}`);
  },

  // Journal
  async getRequests(limit = 100): Promise<{ requests: any[] }> {
    const res = await fetch(`/__admin/requests?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch request journal: ${res.statusText}`);
    return res.json();
  },

  async resetJournal(): Promise<void> {
    const res = await fetch('/__admin/requests/reset', { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to reset journal: ${res.statusText}`);
  }
};
