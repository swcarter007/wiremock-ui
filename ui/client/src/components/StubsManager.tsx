import { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';

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
  const [requestMethod, setRequestMethod] = useState('GET');
  const [urlMatchType, setUrlMatchType] = useState('urlPath');
  const [urlPath, setUrlPath] = useState('');
  
  const [headers, setHeaders] = useState<FieldMatch[]>([]);
  const [queryParams, setQueryParams] = useState<FieldMatch[]>([]);
  
  const [responseStatus, setResponseStatus] = useState(200);
  const [responseBody, setResponseBody] = useState('');
  const [responseDelay, setResponseDelay] = useState(0);
  const [responseHeaders, setResponseHeaders] = useState<HeaderDefinition[]>([]);
  
  const addHeader = () => setHeaders([...headers, { id: Date.now(), key: '', matchType: 'equalTo', value: '' }]);
  const removeHeader = (id: number) => setHeaders(headers.filter(h => h.id !== id));
  
  const addQueryParam = () => setQueryParams([...queryParams, { id: Date.now(), key: '', matchType: 'equalTo', value: '' }]);
  const removeQueryParam = (id: number) => setQueryParams(queryParams.filter(q => q.id !== id));

  const addResponseHeader = () => setResponseHeaders([...responseHeaders, { id: Date.now(), key: '', value: '' }]);
  const removeResponseHeader = (id: number) => setResponseHeaders(responseHeaders.filter(h => h.id !== id));

  const handleSave = () => {
    const payload: any = {
      request: {
        method: requestMethod,
        [urlMatchType]: urlPath
      },
      response: {
        status: responseStatus,
        body: responseBody
      }
    };

    if (responseDelay > 0) {
      payload.response.fixedDelayMilliseconds = responseDelay;
    }
    
    if (responseHeaders.length > 0) {
      payload.response.headers = {};
      responseHeaders.forEach(h => {
        if(h.key) {
          payload.response.headers[h.key] = h.value;
        }
      });
    }
    
    if (headers.length > 0) {
      payload.request.headers = {};
      headers.forEach(h => {
        if(h.key) {
          payload.request.headers[h.key] = { [h.matchType]: h.value };
        }
      });
    }

    if (queryParams.length > 0) {
      payload.request.queryParameters = {};
      queryParams.forEach(q => {
        if(q.key) {
          payload.request.queryParameters[q.key] = { [q.matchType]: q.value };
        }
      });
    }

    fetch('/__admin/mappings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(async res => {
      if(res.ok) {
        try {
          await fetch('/__admin/mappings/save', { method: 'POST' });
        } catch (e) {
          console.error("Failed to persist to disk", e);
        }
        alert("Stub created successfully and persisted to disk!");
      } else {
        alert("Failed to create stub.");
      }
    }).catch(err => {
      console.error(err);
      alert("Error occurred while saving stub.");
    })
  };

  return (
    <div>
      <div className="header-controls">
        <div>
          <h1>Stubs Manager</h1>
          <p>Create and manage your WireMock stubs.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={16} /> Save Stub
        </button>
      </div>

      <div className="card">
        <h2>Request Matching</h2>
        
        <div className="dynamic-row">
          <div className="form-group" style={{ flex: '0 0 150px' }}>
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
          
          <div className="form-group" style={{ flex: '0 0 150px' }}>
            <label>URL Match</label>
            <select value={urlMatchType} onChange={e => setUrlMatchType(e.target.value)}>
              <option value="url">Exact URL</option>
              <option value="urlPath">URL Path</option>
              <option value="urlPattern">URL Pattern (Regex)</option>
              <option value="urlPathPattern">URL Path Pattern</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Path</label>
            <input 
              type="text" 
              placeholder="/api/users" 
              value={urlPath}
              onChange={e => setUrlPath(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <div className="header-controls" style={{ marginBottom: '0.5rem' }}>
            <label style={{ margin: 0 }}>Headers</label>
            <button className="btn" onClick={addHeader}><Plus size={14} /> Add Header</button>
          </div>
          {headers.map((h, i) => (
             <div className="dynamic-row" key={h.id}>
               <input 
                 type="text" 
                 placeholder="Header Name (e.g. Accept)" 
                 value={h.key}
                 onChange={e => {
                   const newH = [...headers];
                   newH[i].key = e.target.value;
                   setHeaders(newH);
                 }}
               />
               <select 
                 value={h.matchType}
                 onChange={e => {
                   const newH = [...headers];
                   newH[i].matchType = e.target.value;
                   setHeaders(newH);
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
                 placeholder="Value" 
                 value={h.value}
                 onChange={e => {
                   const newH = [...headers];
                   newH[i].value = e.target.value;
                   setHeaders(newH);
                 }}
               />
               <button className="btn btn-danger btn-remove" onClick={() => removeHeader(h.id)}>
                 <Trash2 size={16} />
               </button>
             </div>
          ))}
          {headers.length === 0 && <p style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>No headers configured.</p>}
        </div>

        <div className="form-group">
          <div className="header-controls" style={{ marginBottom: '0.5rem' }}>
            <label style={{ margin: 0 }}>Query Parameters</label>
            <button className="btn" onClick={addQueryParam}><Plus size={14} /> Add Param</button>
          </div>
          {queryParams.map((q, i) => (
             <div className="dynamic-row" key={q.id}>
               <input 
                 type="text" 
                 placeholder="Param Name (e.g. search)" 
                 value={q.key}
                 onChange={e => {
                   const newQ = [...queryParams];
                   newQ[i].key = e.target.value;
                   setQueryParams(newQ);
                 }}
               />
               <select 
                 value={q.matchType}
                 onChange={e => {
                   const newQ = [...queryParams];
                   newQ[i].matchType = e.target.value;
                   setQueryParams(newQ);
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
                   const newQ = [...queryParams];
                   newQ[i].value = e.target.value;
                   setQueryParams(newQ);
                 }}
               />
               <button className="btn btn-danger btn-remove" onClick={() => removeQueryParam(q.id)}>
                 <Trash2 size={16} />
               </button>
             </div>
          ))}
          {queryParams.length === 0 && <p style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>No query params configured.</p>}
        </div>
      </div>

      <div className="card">
        <h2>Response Definition</h2>
        
        <div className="dynamic-row">
          <div className="form-group" style={{ flex: '0 0 150px' }}>
            <label>Status Code</label>
            <input 
              type="number" 
              value={responseStatus} 
              onChange={e => setResponseStatus(parseInt(e.target.value) || 200)} 
            />
          </div>
          <div className="form-group" style={{ flex: '0 0 150px' }}>
            <label>Fixed Delay (ms)</label>
            <input 
              type="number" 
              value={responseDelay} 
              onChange={e => setResponseDelay(parseInt(e.target.value) || 0)} 
              placeholder="0 (no delay)"
            />
          </div>
        </div>

        <div className="form-group">
          <div className="header-controls" style={{ marginBottom: '0.5rem' }}>
            <label style={{ margin: 0 }}>Response Headers</label>
            <button className="btn" onClick={addResponseHeader}><Plus size={14} /> Add Header</button>
          </div>
          {responseHeaders.map((h, i) => (
             <div className="dynamic-row" key={h.id}>
               <input 
                 type="text" 
                 placeholder="Header Name (e.g. Content-Type)" 
                 value={h.key}
                 onChange={e => {
                   const newH = [...responseHeaders];
                   newH[i].key = e.target.value;
                   setResponseHeaders(newH);
                 }}
               />
               <input 
                 type="text" 
                 placeholder="Value" 
                 value={h.value}
                 onChange={e => {
                   const newH = [...responseHeaders];
                   newH[i].value = e.target.value;
                   setResponseHeaders(newH);
                 }}
               />
               <button className="btn btn-danger btn-remove" onClick={() => removeResponseHeader(h.id)}>
                 <Trash2 size={16} />
               </button>
             </div>
          ))}
          {responseHeaders.length === 0 && <p style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>No response headers configured.</p>}
        </div>

        <div className="form-group">
          <label>Response Body</label>
          <textarea 
            placeholder='{"status": "success"}'
            value={responseBody}
            onChange={e => setResponseBody(e.target.value)}
          ></textarea>
        </div>
      </div>
    </div>
  );
}
