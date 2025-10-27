import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [punches, setPunches] = useState([]);
  const [manualTime, setManualTime] = useState('');

  const backendURL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

  const fetchPunches = async () => {
    try {
      const res = await axios.get(`${backendURL}/api/punches`);
      setPunches(res.data);
    } catch (err) {
      console.error('Error fetching punches:', err);
    }
  };

  const punchIn = async () => {
    const now = new Date();
    const localTime = now.toLocaleString();
    const timeToSave = manualTime || localTime;

    try {
      await axios.post(`${backendURL}/api/punch`, { time: timeToSave });
      setManualTime('');
      fetchPunches();
    } catch (err) {
      console.error('Error punching in:', err);
    }
  };

  useEffect(() => {
    fetchPunches();
  }, []);

  return (
    <div className="container">
      <h2>⏰ Punch In App</h2>

      <p><strong>Local Time:</strong> {new Date().toLocaleString()}</p>

      <input
        type="text"
        placeholder="Enter time manually (optional)"
        value={manualTime}
        onChange={(e) => setManualTime(e.target.value)}
      />

      <div>
        <button onClick={punchIn}>Punch In</button>
      </div>

      <h3>Recent Punches</h3>
      <ul style={{ textAlign: 'left' }}>
        {punches.map((p, i) => (
          <li key={i}>{p.time}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
