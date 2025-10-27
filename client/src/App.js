import React, { useEffect, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || ''; // on Render the client will be served from its own domain; set REACT_APP_API_BASE if needed

function useLocalTime() {
  // returns ISO string of local now; if not available, returns null
  try {
    const d = new Date();
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch (e) {
    return null;
  }
}

function formatForInput(iso) {
  if (!iso) return '';
  // datetime-local expects yyyy-MM-ddThh:mm
  const dt = new Date(iso);
  const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0,16);
}

function isoFromInput(value) {
  // value is like "2025-10-27T21:30"
  if (!value) return null;
  const dt = new Date(value);
  return dt.toISOString();
}

export default function App() {
  const [punches, setPunches] = useState([]);
  const [manualInput, setManualInput] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const localIso = useLocalTime();
  const [useLocal, setUseLocal] = useState(!!localIso);

  async function fetchPunches() {
    setLoading(true);
    try {
      const r = await fetch(API_BASE + '/api/punches');
      const data = await r.json();
      setPunches(data);
    } catch (e) {
      console.error('Failed to fetch punches', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPunches();
  }, []);

  async function submitPunch() {
    let timeIso = null;
    if (useLocal && localIso) {
      timeIso = localIso;
    } else {
      timeIso = isoFromInput(manualInput);
    }

    if (!timeIso) {
      alert('Please provide a valid time (local or manual).');
      return;
    }

    try {
      const res = await fetch(API_BASE + '/api/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time: timeIso, note })
      });
      if (!res.ok) {
        const err = await res.json();
        alert('Failed to save: ' + (err.error || res.statusText));
        return;
      }
      setNote('');
      setManualInput('');
      // refresh list
      await fetchPunches();
    } catch (e) {
      console.error('Save failed', e);
      alert('Save failed');
    }
  }

  return (
    <div className="app">
      <h1>Punch In</h1>

      <div className="card">
        <div className="row">
          <label>
            <input
              type="checkbox"
              checked={useLocal}
              onChange={() => setUseLocal(v => !v)}
            />
            Use local time ({localIso ? new Date(localIso).toLocaleString() : 'not available'})
          </label>
        </div>

        {!useLocal && (
          <div className="row">
            <label>Manual time:
              <input
                type="datetime-local"
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
              />
            </label>
          </div>
        )}

        <div className="row">
          <label>Note (optional):
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g., start shift"/>
          </label>
        </div>

        <div className="row">
          <button onClick={submitPunch}>Punch In</button>
          <button onClick={fetchPunches} style={{marginLeft:10}}>Refresh</button>
        </div>
      </div>

      <h2>Recent punches</h2>
      <div className="card">
        {loading ? <div>Loading...</div> : null}
        {!loading && punches.length === 0 && <div>No punches yet.</div>}
        <ul className="punch-list">
          {punches.map((p, idx) => {
            const displayTime = p.time ? new Date(p.time).toLocaleString() : '—';
            return (
              <li key={idx} className="punch-item">
                <div><strong>{displayTime}</strong></div>
                {p.note ? <div className="note">{p.note}</div> : null}
                <div className="meta">stored: {p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}</div>
              </li>
            );
          })}
        </ul>
      </div>
      <footer style={{marginTop:20, fontSize:12}}>Note: times are stored in ISO format (UTC). Displayed in your browser's locale.</footer>
    </div>
  );
}






// // client/src/App.js
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import "./App.css";

// export default function App() {
//   const [punches, setPunches] = useState([]);
//   const [manualTime, setManualTime] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState(null);

//   const backendURL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

//   async function fetchPunches() {
//     try {
//       const res = await axios.get(`${backendURL}/api/punches`);
//       setPunches(res.data || []);
//     } catch (err) {
//       console.error("Error fetching punches:", err);
//       setMessage({ type: "error", text: "Failed to fetch punches" });
//     }
//   }

//   useEffect(() => {
//     fetchPunches();
//     const id = setInterval(fetchPunches, 10000);
//     return () => clearInterval(id);
//   }, []);

//   const handlePunchIn = async () => {
//     setLoading(true);
//     setMessage(null);
//     const timeISO = manualTime ? new Date(manualTime).toISOString() : new Date().toISOString();
//     try {
//       const res = await axios.post(`${backendURL}/api/punch-in`, { time: timeISO });
//       setMessage({ type: "success", text: "Punch In recorded" });
//       setManualTime("");
//       await fetchPunches();
//     } catch (err) {
//       console.error("Error punching in:", err);
//       setMessage({ type: "error", text: "Punch In failed" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePunchOut = async () => {
//     setLoading(true);
//     setMessage(null);
//     const timeISO = manualTime ? new Date(manualTime).toISOString() : new Date().toISOString();
//     try {
//       const res = await axios.post(`${backendURL}/api/punch-out`, { time: timeISO });
//       setMessage({ type: "success", text: "Punch Out recorded" });
//       setManualTime("");
//       await fetchPunches();
//     } catch (err) {
//       console.error("Error punching out:", err);
//       const errMsg = err?.response?.data?.error || "Punch Out failed";
//       setMessage({ type: "error", text: errMsg });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const latestOpen = punches.length ? punches.find((p) => !p.punchOut) : null;

//   return (
//     <div className="container">
//       <h1>⏰ Punch In / Out</h1>

//       <p>
//         <strong>Local Time:</strong> {new Date().toLocaleString()}
//       </p>

//       <div className="controls">
//         <input
//           type="datetime-local"
//           value={manualTime}
//           onChange={(e) => setManualTime(e.target.value)}
//           placeholder="Optional manual time"
//         />

//         <div style={{ display: "inline-block", marginLeft: 12 }}>
//           <button type="button" onClick={handlePunchIn} disabled={loading}>
//             Punch In
//           </button>
//           <button
//             type="button"
//             onClick={handlePunchOut}
//             disabled={loading || !latestOpen}
//             style={{ marginLeft: 8 }}
//           >
//             Punch Out
//           </button>
//         </div>
//       </div>

//       {message && (
//         <div className={`msg ${message.type === "error" ? "error" : "success"}`}>{message.text}</div>
//       )}

//       <h3>History (latest first)</h3>
//       <div className="table-wrap">
//         <table className="history-table">
//           <thead>
//             <tr>
//               <th>Date</th>
//               <th>Punch In</th>
//               <th>Punch Out</th>
//             </tr>
//           </thead>
//           <tbody>
//             {punches.length === 0 ? (
//               <tr>
//                 <td colSpan="3">No punches yet</td>
//               </tr>
//             ) : (
//               punches.map((p) => (
//                 <tr key={p.id}>
//                   <td>{p.date || (p.punchIn ? new Date(p.punchIn).toLocaleDateString() : "")}</td>
//                   <td>{p.punchIn ? new Date(p.punchIn).toLocaleString() : ""}</td>
//                   <td>{p.punchOut ? new Date(p.punchOut).toLocaleString() : "—"}</td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }























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
