import { useState } from 'react';

export default function AdminActions() {
  const [saving, setSaving] = useState(false);

  const handleSaveState = async () => {
    setSaving(true);
    try {
      const res = await fetch('/__admin/mappings/save', {
        method: 'POST'
      });
      if (res.ok) {
        alert("State successfully saved to the mapped disk volume!");
      } else {
        alert("Failed to save state.");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred while saving state.");
    }
    setSaving(false);
  };

  return (
    <div>
      <h1>Admin Actions</h1>
      <p>Manage WireMock state and configuration.</p>
      <div className="card">
        <h3>Persistence</h3>
        <p>Save current in-memory stubs to the mapped disk volume.</p>
        <button className="btn btn-primary" onClick={handleSaveState} disabled={saving}>
          {saving ? 'Saving...' : 'Save State'}
        </button>
      </div>
    </div>
  );
}
