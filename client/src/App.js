// client/src/App.js
import React, { useEffect, useState } from "react";
import "./App.css";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "./authConfig";

const API_BASE = process.env.REACT_APP_API_BASE || "";

const msalInstance = new PublicClientApplication(msalConfig);

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

function timeGreetingByHour(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function App() {
  const [account, setAccount] = useState(null); // holds name/email
  const [punches, setPunches] = useState([]);
  const [manualInput, setManualInput] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const localIso = useLocalTime();
  const [useLocal, setUseLocal] = useState(!!localIso);
  const [greetingVisible, setGreetingVisible] = useState("");
  const [isDarkVariant, setIsDarkVariant] = useState(false);


    // For backend API calls — update this to your deployed backend URL if needed
  const API_BASE = "";
  
  // init: if user session exists
  useEffect(() => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts && accounts.length > 0) {
      setAccount(accounts[0]);
    }
    fetchPunches();
    // read theme from localStorage
    const saved = localStorage.getItem("punch_theme_dark");
    setIsDarkVariant(saved === "true");
  }, []);

  // login
  async function signIn() {
    try {
      const result = await msalInstance.loginPopup(loginRequest);
      if (result && result.account) {
        setAccount(result.account);
      }
    } catch (err) {
      console.error("Login failed", err);
      alert("Login failed: " + (err.message || err));
    }
  }

  function signOut() {
    const logoutRequest = {
      account: msalInstance.getActiveAccount() || account
    };
    try {
      msalInstance.logoutPopup(logoutRequest).then(() => {
        setAccount(null);
        // clear any app-only data if needed
      });
    } catch (err) {
      console.warn("Logout error", err);
      setAccount(null);
    }
  }

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

  function showPersonalGreeting() {
    const hour = new Date().getHours();
    const base = timeGreetingByHour(hour);
    const name = account?.name || account?.username || "";
    const msg = `${base}${name ? ", " + name : "!"}`;
    setGreetingVisible(msg);
    setTimeout(() => setGreetingVisible(""), 4000);
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
      // optional: attach bearer token later if you want to secure server calls
      const res = await fetch(API_BASE + "/api/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time: timeIso, note })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert("Failed to save: " + (err.error || res.statusText));
        return;
      }

      setNote("");
      setManualInput("");
      await fetchPunches();

      // show greeting after successful punch
      showPersonalGreeting();
    } catch (e) {
      console.error("Save failed", e);
      alert("Save failed");
    }
  }

  function toggleTheme() {
    const next = !isDarkVariant;
    setIsDarkVariant(next);
    localStorage.setItem("punch_theme_dark", String(next));
  }

  return (
    <div className={`app-root ${isDarkVariant ? "dark-variant" : "light-variant"}`}>
      <header className="site-header">
        <h1>⏰ Punch In</h1>
        <div className="header-right">
          {account ? (
            <>
              <div className="user-info">
                <div className="user-name">{account.name}</div>
                <div className="user-email">{account.username}</div>
              </div>
              <button className="btn link" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <button className="btn" onClick={signIn}>Sign in with Office 365</button>
          )}
          <button className="btn small" onClick={toggleTheme}>
            Theme: {isDarkVariant ? "Gradient Dark" : "Gradient Light"}
          </button>
        </div>
      </header>

      {greetingVisible && <div className="greeting">{greetingVisible}</div>}

      <main className="main-content">
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

        <section className="table-section">
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
                      <td>{p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      <footer className="site-footer">
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







