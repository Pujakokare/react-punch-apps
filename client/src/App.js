import React, { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import PunchInPage from "./PunchInPage";

export default function App() {
  const { instance, accounts } = useMsal();
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (accounts.length > 0) {
      setUser(accounts[0]);
    }
  }, [accounts]);

  const login = async () => {
    try {
      const response = await instance.loginPopup({
        scopes: ["User.Read"],
      });
      setUser(response.account);
    } catch (err) {
      console.error(err);
      alert("Login failed. Check console for details.");
    }
  };

  const logout = async () => {
    try {
      await instance.logoutPopup();
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Personalized greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 18
      ? "Good afternoon"
      : "Good evening";

  if (!user) {
    return (
      <div className={`login-screen ${theme}`}>
        <div className="theme-toggle" onClick={toggleTheme}>
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </div>

        <div className="login-card">
          <h1>Welcome to Punch App</h1>
          <button onClick={login}>Login with Office 365</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${theme}`}>
      <div className="top-bar">
        <div className="greeting">
          👋 {greeting}, <strong>{user.name || user.username}</strong>
          <br />
          <small>{user.username}</small>
        </div>
        <button className="logout" onClick={logout}>
          Logout
        </button>
        <button className="theme-btn" onClick={toggleTheme}>
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>

      <PunchInPage />
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







