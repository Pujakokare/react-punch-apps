import React, { useState, useEffect } from "react";
import "./App.css";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "./authConfig";

const API_BASE = process.env.REACT_APP_API_BASE || "";
const msalInstance = new PublicClientApplication(msalConfig);

export default function App() {
  const [account, setAccount] = useState(null);
  const [punches, setPunches] = useState([]);
  const [note, setNote] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [useLocal, setUseLocal] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const localIso = new Date().toISOString();

  // -------- Microsoft Login ----------
  useEffect(() => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) setAccount(accounts[0]);
  }, []);

  async function handleLogin() {
    try {
      const response = await msalInstance.loginPopup(loginRequest);
      setAccount(response.account);
    } catch (err) {
      console.error("Login failed", err);
    }
  }

  function handleLogout() {
    msalInstance.logout();
  }

  // -------- Fetch & Save Punches ----------
  async function fetchPunches() {
    const r = await fetch(API_BASE + "/api/punches");
    const data = await r.json();
    setPunches(data);
  }

  useEffect(() => { fetchPunches(); }, []);

  async function submitPunch() {
    const time = useLocal ? localIso : new Date(manualInput).toISOString();
    if (!time) { alert("Please select time"); return; }

    await fetch(API_BASE + "/api/punch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time, note })
    });
    setNote("");
    fetchPunches();
  }

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }

  // ---------- UI ----------
  if (!account) {
    return (
      <div className={`login-page ${darkMode ? "dark" : ""}`}>
        <div className="theme-toggle" onClick={() => setDarkMode(d => !d)}>
          {darkMode ? "🌞 Light" : "🌙 Dark"}
        </div>
        <div className="login-box">
          <h1>Welcome to Punch App</h1>
          <button onClick={handleLogin}>Login with Office 365</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${darkMode ? "dark" : ""}`}>
      <header>
        <div className="user-info">
          <h2>{getGreeting()}, {account.name?.split(" ")[0]} 👋</h2>
          <p>{account.username}</p>
        </div>
        <div>
          <button onClick={() => setDarkMode(d => !d)}>
            {darkMode ? "🌞 Light" : "🌙 Dark"}
          </button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <section className="punch-section">
        <h3>Punch In</h3>
        <label>
          <input
            type="checkbox"
            checked={useLocal}
            onChange={() => setUseLocal(v => !v)}
          /> Use Local Time
        </label>

        {!useLocal && (
          <input
            type="datetime-local"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
          />
        )}

        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={e => setNote(e.target.value)}
        />

        <button onClick={submitPunch}>Punch In</button>
      </section>

      <section className="table-container">
        <h3>Recent Punches</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Punch Time</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {punches.map((p, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{new Date(p.time).toLocaleString()}</td>
                <td>{p.note || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}






















// import React, { useEffect, useState } from "react";
// import "./App.css";

// const API_BASE = process.env.REACT_APP_API_BASE || "";

// function useLocalTime() {
//   try {
//     const d = new Date();
//     if (isNaN(d.getTime())) return null;
//     return d.toISOString();
//   } catch {
//     return null;
//   }
// }

// function isoFromInput(value) {
//   if (!value) return null;
//   const dt = new Date(value);
//   return dt.toISOString();
// }

// export default function App() {
//   const [punches, setPunches] = useState([]);
//   const [manualInput, setManualInput] = useState("");
//   const [note, setNote] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [greeting, setGreeting] = useState("");
//   const localIso = useLocalTime();
//   const [useLocal, setUseLocal] = useState(!!localIso);

//   async function fetchPunches() {
//     setLoading(true);
//     try {
//       const r = await fetch(API_BASE + "/api/punches");
//       const data = await r.json();
//       setPunches(data);
//     } catch (e) {
//       console.error("Failed to fetch punches", e);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     fetchPunches();
//   }, []);

//   function getGreeting() {
//     const hour = new Date().getHours();
//     if (hour < 12) return "🌞 Good morning! Have a productive day ahead.";
//     if (hour < 17) return "🌤️ Good afternoon! Keep up the great work.";
//     return "🌙 Good evening! Great job finishing strong today.";
//   }

//   async function submitPunch() {
//     let timeIso = null;
//     if (useLocal && localIso) timeIso = localIso;
//     else timeIso = isoFromInput(manualInput);

//     if (!timeIso) {
//       alert("Please provide a valid time (local or manual).");
//       return;
//     }

//     try {
//       const res = await fetch(API_BASE + "/api/punch", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ time: timeIso, note }),
//       });

//       if (!res.ok) {
//         const err = await res.json();
//         alert("Failed to save: " + (err.error || res.statusText));
//         return;
//       }

//       setNote("");
//       setManualInput("");
//       await fetchPunches();

//       // ✅ Show greeting message
//       const msg = getGreeting();
//       setGreeting(msg);
//       setTimeout(() => setGreeting(""), 4000);
//     } catch (e) {
//       console.error("Save failed", e);
//       alert("Save failed");
//     }
//   }

//   return (
//     <div className="app-container">
//       <h1>⏰ Punch In</h1>

//       {greeting && <div className="greeting">{greeting}</div>}

//       <div className="punch-card">
//         <div className="row">
//           <label>
//             <input
//               type="checkbox"
//               checked={useLocal}
//               onChange={() => setUseLocal((v) => !v)}
//             />
//             Use local time (
//             {localIso ? new Date(localIso).toLocaleString() : "not available"})
//           </label>
//         </div>

//         {!useLocal && (
//           <div className="row">
//             <label>
//               Manual time:
//               <input
//                 type="datetime-local"
//                 value={manualInput}
//                 onChange={(e) => setManualInput(e.target.value)}
//               />
//             </label>
//           </div>
//         )}

//         <div className="row">
//           <label>
//             Note (optional):
//             <input
//               value={note}
//               onChange={(e) => setNote(e.target.value)}
//               placeholder="e.g., start shift"
//             />
//           </label>
//         </div>

//         <div className="row buttons">
//           <button onClick={submitPunch}>Punch In</button>
//           <button onClick={fetchPunches}>Refresh</button>
//         </div>
//       </div>

//       <h2>🗓️ Recent Punches</h2>

//       <div className="table-container">
//         {loading ? (
//           <div>Loading...</div>
//         ) : punches.length === 0 ? (
//           <div>No punches yet.</div>
//         ) : (
//           <table>
//             <thead>
//               <tr>
//                 <th>#</th>
//                 <th>Punch Time</th>
//                 <th>Note</th>
//                 <th>Recorded At</th>
//               </tr>
//             </thead>
//             <tbody>
//               {punches.map((p, i) => (
//                 <tr key={i}>
//                   <td>{i + 1}</td>
//                   <td>{new Date(p.time).toLocaleString()}</td>
//                   <td>{p.note || "—"}</td>
//                   <td>
//                     {p.createdAt
//                       ? new Date(p.createdAt).toLocaleString()
//                       : "—"}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>

//       <footer>
//         <small>
//           Times stored in UTC (ISO). Displayed in your local time zone.
//         </small>
//       </footer>
//     </div>
//   );
// }







