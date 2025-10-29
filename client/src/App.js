import React, { useEffect, useState } from "react";
import "./App.css";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "./authConfig";

const API_BASE = process.env.REACT_APP_API_BASE || ""; // e.g., "https://your-server.onrender.com"

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

function AccountInfo({ account }) {
  if (!account) return null;
  return (
    <div className="account-info">
      <div><strong>{account.name}</strong></div>
      <div style={{fontSize:12,color:"#555"}}>{account.username}</div>
    </div>
  );
}

export default function App() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const account = accounts && accounts.length > 0 ? accounts[0] : null;

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

  async function handleLogin() {
    try {
      await instance.loginPopup(loginRequest);
      // after login, fetch any further info if needed
      await fetchPunches();
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  }

  function handleLogout() {
    instance.logoutPopup();
  }

  async function submitPunch() {
    if (!isAuthenticated || !account) {
      alert("Please sign in with your Office 365 account first.");
      return;
    }

    let timeIso = null;
    if (useLocal && localIso) timeIso = localIso;
    else timeIso = isoFromInput(manualInput);

    if (!timeIso) {
      alert("Please provide a valid time (local or manual).");
      return;
    }

    const user = {
      name: account.name,
      email: account.username
    };

    try {
      const res = await fetch(API_BASE + "/api/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time: timeIso, note, user })
      });

      if (!res.ok) {
        const err = await res.json();
        alert("Failed to save: " + (err.error || res.statusText));
        return;
      }

      setNote("");
      setManualInput("");
      await fetchPunches();

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
      <header style={{width:"100%", maxWidth:900, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <h1 style={{margin:0}}>⏰ Punch In</h1>
          {account && <div style={{fontSize:12,color:"#555"}}>Welcome, {account.name}</div>}
        </div>

        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <AccountInfo account={account} />
          {!isAuthenticated ? (
            <button onClick={handleLogin}>Sign in with Office 365</button>
          ) : (
            <button onClick={handleLogout}>Sign out</button>
          )}
        </div>
      </header>

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
                <th>User</th>
                <th>Recorded At</th>
              </tr>
            </thead>
            <tbody>
              {punches.map((p, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{new Date(p.time).toLocaleString()}</td>
                  <td>{p.note || "—"}</td>
                  <td>{p.user ? `${p.user.name} (${p.user.email})` : "—"}</td>
                  <td>
                    {p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <footer>
        <small>Times stored in UTC (ISO). Displayed in your local time zone.</small>
      </footer>
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







