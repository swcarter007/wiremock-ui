import { useEffect, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';

export default function Dashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const resMatched = await fetch('/__admin/requests');
      const data = await resMatched.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Failed to fetch requests", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div>
      <div className="header-controls">
        <div>
          <h1>Request Journal</h1>
          <p>Here you can view the requests made to WireMock.</p>
        </div>
        <button className="btn" onClick={fetchRequests} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Refresh
        </button>
      </div>

      <div className="card">
        {requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <Search size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <p>No requests found in the journal.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Method</th>
                  <th>URL</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`method-badge method-${req.request.method}`}>
                        {req.request.method}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{req.request.url}</td>
                    <td>
                      {req.response && req.response.status ? (
                        <span className={`status-badge status-${req.response.status >= 500 ? '5xx' : req.response.status >= 400 ? '4xx' : '2xx'}`}>
                          {req.response.status}
                        </span>
                      ) : (
                        <span className="status-badge" style={{ background: '#334155', color: '#f8fafc' }}>N/A</span>
                      )}
                    </td>
                    <td>{new Date(req.request.loggedDate).toLocaleString()}</td>
                    <td>
                      <button className="btn" onClick={() => alert(JSON.stringify(req, null, 2))}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
