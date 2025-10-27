import React, { useEffect, useState } from "react";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_BASE || "";

function useLocalTime() {
  try {
    const d = new Date();
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

function isoFromInput(value) {
  if (!value) return null;
  const dt = new Date(value);
  return dt.toISOString();
}

export default function App() {
  const [punches, setPunches] = useState([]);
  const [manualInput, setManualInput] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState("");
  const localIso = useLocalTime();
  const [useLocal, setUseLocal] = useState(!!localIso);

  async function fetchPunches() {
    setLoading(true);
    try {
      const r = await fetch(API_BASE + "/api/punches");
      const data = await r.json();
      setPunches(data);
    } catch (e) {
      console.error("Failed to fetch punches", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPunches();
  }, []);

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning ☀️";
    if (hour < 17) return "Good afternoon 🌤️";
    return "Good evening 🌙";
  }

  async function submitPunch() {
    let timeIso = null;
    if (useLocal && localIso) timeIso = localIso;
    else timeIso = isoFromInput(manualInput);

    if (!timeIso) {
      alert("Please provide a valid time (local or manual).");
      return;
    }

    try {
      const res = await fetch(API_BASE + "/api/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time: timeIso, note }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert("Failed to save: " + (err.error || res.statusText));
        return;
      }

      setNote("");
      setManualInput("");
      await fetchPunches();

      // ✅ Show greeting message
      const msg = getGreeting();
      setGreeting(msg);
      setTimeout(() => setGreeting(""), 4000);
    } catch (e) {
      console.error("Save failed", e);
      alert("Save failed");
    }
  }

  return (
    <div className="app-container">
      <h1>⏰ Punch In</h1>

      {greeting && <div className="greeting">{greeting}</div>}

      <div className="punch-card">
        <div className="row">
          <label>
            <input
              type="checkbox"
              checked={useLocal}
              onChange={() => setUseLocal((v) => !v)}
            />
            Use local time (
            {localIso ? new Date(localIso).toLocaleString() : "not available"})
          </label>
        </div>

        {!useLocal && (
          <div className="row">
            <label>
              Manual time:
              <input
                type="datetime-local"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
              />
            </label>
          </div>
        )}

        <div className="row">
          <label>
            Note (optional):
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., start shift"
            />
          </label>
        </div>

        <div className="row buttons">
          <button onClick={submitPunch}>Punch In</button>
          <button onClick={fetchPunches}>Refresh</button>
        </div>
      </div>

      <h2>🗓️ Recent Punches</h2>

      <div className="table-container">
        {loading ? (
          <div>Loading...</div>
        ) : punches.length === 0 ? (
          <div>No punches yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Punch Time</th>
                <th>Note</th>
                <th>Recorded At</th>
              </tr>
            </thead>
            <tbody>
              {punches.map((p, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{new Date(p.time).toLocaleString()}</td>
                  <td>{p.note || "—"}</td>
                  <td>
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <footer>
        <small>
          Times stored in UTC (ISO). Displayed in your local time zone.
        </small>
      </footer>
    </div>
  );
}


















// import React, { useEffect, useState } from 'react';

// const API_BASE = process.env.REACT_APP_API_BASE || ''; // on Render the client will be served from its own domain; set REACT_APP_API_BASE if needed

// function useLocalTime() {
//   // returns ISO string of local now; if not available, returns null
//   try {
//     const d = new Date();
//     if (isNaN(d.getTime())) return null;
//     return d.toISOString();
//   } catch (e) {
//     return null;
//   }
// }

// function formatForInput(iso) {
//   if (!iso) return '';
//   // datetime-local expects yyyy-MM-ddThh:mm
//   const dt = new Date(iso);
//   const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
//   return local.toISOString().slice(0,16);
// }

// function isoFromInput(value) {
//   // value is like "2025-10-27T21:30"
//   if (!value) return null;
//   const dt = new Date(value);
//   return dt.toISOString();
// }

// export default function App() {
//   const [punches, setPunches] = useState([]);
//   const [manualInput, setManualInput] = useState('');
//   const [note, setNote] = useState('');
//   const [loading, setLoading] = useState(false);
//   const localIso = useLocalTime();
//   const [useLocal, setUseLocal] = useState(!!localIso);

//   async function fetchPunches() {
//     setLoading(true);
//     try {
//       const r = await fetch(API_BASE + '/api/punches');
//       const data = await r.json();
//       setPunches(data);
//     } catch (e) {
//       console.error('Failed to fetch punches', e);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     fetchPunches();
//   }, []);

//   async function submitPunch() {
//     let timeIso = null;
//     if (useLocal && localIso) {
//       timeIso = localIso;
//     } else {
//       timeIso = isoFromInput(manualInput);
//     }

//     if (!timeIso) {
//       alert('Please provide a valid time (local or manual).');
//       return;
//     }

//     try {
//       const res = await fetch(API_BASE + '/api/punch', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ time: timeIso, note })
//       });
//       if (!res.ok) {
//         const err = await res.json();
//         alert('Failed to save: ' + (err.error || res.statusText));
//         return;
//       }
//       setNote('');
//       setManualInput('');
//       // refresh list
//       await fetchPunches();
//     } catch (e) {
//       console.error('Save failed', e);
//       alert('Save failed');
//     }
//   }

//   return (
//     <div className="app">
//       <h1>Punch In</h1>

//       <div className="card">
//         <div className="row">
//           <label>
//             <input
//               type="checkbox"
//               checked={useLocal}
//               onChange={() => setUseLocal(v => !v)}
//             />
//             Use local time ({localIso ? new Date(localIso).toLocaleString() : 'not available'})
//           </label>
//         </div>

//         {!useLocal && (
//           <div className="row">
//             <label>Manual time:
//               <input
//                 type="datetime-local"
//                 value={manualInput}
//                 onChange={e => setManualInput(e.target.value)}
//               />
//             </label>
//           </div>
//         )}

//         <div className="row">
//           <label>Note (optional):
//             <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g., start shift"/>
//           </label>
//         </div>

//         <div className="row">
//           <button onClick={submitPunch}>Punch In</button>
//           <button onClick={fetchPunches} style={{marginLeft:10}}>Refresh</button>
//         </div>
//       </div>

//       <h2>Recent punches</h2>
//       <div className="card">
//         {loading ? <div>Loading...</div> : null}
//         {!loading && punches.length === 0 && <div>No punches yet.</div>}
//         <ul className="punch-list">
//           {punches.map((p, idx) => {
//             const displayTime = p.time ? new Date(p.time).toLocaleString() : '—';
//             return (
//               <li key={idx} className="punch-item">
//                 <div><strong>{displayTime}</strong></div>
//                 {p.note ? <div className="note">{p.note}</div> : null}
//                 <div className="meta">stored: {p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}</div>
//               </li>
//             );
//           })}
//         </ul>
//       </div>
//       <footer style={{marginTop:20, fontSize:12}}>Note: times are stored in ISO format (UTC). Displayed in your browser's locale.</footer>
//     </div>
//   );
// }

