import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const [punches, setPunches] = useState([]);
  const [manualTime, setManualTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const backendURL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

  async function fetchPunches() {
    try {
      const res = await axios.get(`${backendURL}/api/punches`);
      setPunches(res.data || []);
    } catch (err) {
      console.error("Error fetching punches:", err);
      setMessage({ type: "error", text: "Failed to fetch punches" });
    }
  }

  useEffect(() => {
    fetchPunches();
    // poll every 10s to keep it fresh (optional)
    const id = setInterval(fetchPunches, 10000);
    return () => clearInterval(id);
  }, []);

  const handlePunchIn = async () => {
    setLoading(true);
    setMessage(null);
    const timeISO = manualTime ? new Date(manualTime).toISOString() : new Date().toISOString();
    try {
      const res = await axios.post(`${backendURL}/api/punch-in`, { time: timeISO });
      setMessage({ type: "success", text: "Punch In recorded" });
      setManualTime("");
      await fetchPunches();
    } catch (err) {
      console.error("Error punching in:", err);
      setMessage({ type: "error", text: "Punch In failed" });
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    setLoading(true);
    setMessage(null);
    const timeISO = manualTime ? new Date(manualTime).toISOString() : new Date().toISOString();
    try {
      const res = await axios.post(`${backendURL}/api/punch-out`, { time: timeISO });
      setMessage({ type: "success", text: "Punch Out recorded" });
      setManualTime("");
      await fetchPunches();
    } catch (err) {
      console.error("Error punching out:", err);
      const errMsg = err?.response?.data?.error || "Punch Out failed";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  // Determine whether there is an open punch (latest record with null punchOut)
  const latestOpen = punches.length ? punches.find(p => !p.punchOut) : null;

  return (
    <div className="container">
      <h1>⏰ Punch In / Out</h1>

      <p><strong>Local Time:</strong> {new Date().toLocaleString()}</p>

      <div className="controls">
        <input
          type="datetime-local"
          value={manualTime}
          onChange={(e) => setManualTime(e.target.value)}
          placeholder="Optional manual time"
        />

        <div style={{ display: "inline-block", marginLeft: 12 }}>
          <button type="button" onClick={handlePunchIn} disabled={loading}>
            Punch In
          </button>
          <button
            type="button"
            onClick={handlePunchOut}
            disabled={loading || !latestOpen}
            style={{ marginLeft: 8 }}
          >
            Punch Out
          </button>
        </div>
      </div>

      {message && (
        <div className={`msg ${message.type === "error" ? "error" : "success"}`}>
          {message.text}
        </div>
      )}

      <h3>History (latest first)</h3>
      <div className="table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Punch In</th>
              <th>Punch Out</th>
            </tr>
          </thead>
          <tbody>
            {punches.length === 0 ? (
              <tr>
                <td colSpan="3">No punches yet</td>
              </tr>
            ) : (
              punches.map((p) => (
                <tr key={p.id}>
                  <td>{p.date || (p.punchIn ? new Date(p.punchIn).toLocaleDateString() : "")}</td>
                  <td>{p.punchIn ? new Date(p.punchIn).toLocaleString() : ""}</td>
                  <td>{p.punchOut ? new Date(p.punchOut).toLocaleString() : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}























// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// function App() {
//   const [punches, setPunches] = useState([]);
//   const [manualTime, setManualTime] = useState('');

//   const backendURL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

//   const fetchPunches = async () => {
//     try {
//       const res = await axios.get(`${backendURL}/api/punches`);
//       setPunches(res.data);
//     } catch (err) {
//       console.error('❌ Error fetching punches:', err);
//     }
//   };

//   const punchIn = async () => {
//     console.log("✅ punchIn() function triggered"); // VERY IMPORTANT
//     const now = new Date();
//     const localTime = now.toLocaleString();
//     const timeToSave = manualTime || localTime;

//     try {
//       await axios.post(`${backendURL}/api/punch`, { time: timeToSave });
//       console.log("✅ Time saved successfully");
//       setManualTime('');
//       fetchPunches();
//     } catch (err) {
//       console.error('❌ Error punching in:', err);
//     }
//   };

//   useEffect(() => {
//     fetchPunches();
//   }, []);

//   return (
//     <div className="container">
//       <h2>⏰ Punch In App</h2>
//       <p><strong>Local Time:</strong> {new Date().toLocaleString()}</p>

//       <input
//         type="text"
//         placeholder="Enter time manually (optional)"
//         value={manualTime}
//         onChange={(e) => setManualTime(e.target.value)}
//       />

//       <div>
//         <button
//           type="button"
//           onClick={() => {
//             console.log("✅ Button clicked");
//             punchIn();
//           }}
//         >
//           Punch In
//         </button>
//       </div>

//       <h3>Recent Punches</h3>
//       <ul style={{ textAlign: 'left' }}>
//         {punches.map((p, i) => (
//           <li key={i}>{p.time}</li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// export default App;
