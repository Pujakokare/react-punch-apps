import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate, useAccount } from "@azure/msal-react";
import { loginRequest } from './authConfig';

function SignInButton() {
  const { instance } = useMsal();

  const handleLogin = async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch (e) {
      console.error(e);
      // fallback to redirect if popup is blocked: instance.loginRedirect(loginRequest)
    }
  };

  return <button onClick={handleLogin}>Sign in with Office 365</button>;
}

function SignOutButton() {
  const { instance } = useMsal();
  const handleLogout = () => instance.logoutPopup().catch(e => console.error(e));
  return <button onClick={handleLogout}>Sign out</button>;
}

export default function App() {
  const { instance, accounts } = useMsal();
  const account = accounts[0] || null;
  const [punches, setPunches] = useState([]);
  const [manualTime, setManualTime] = useState('');

  const backendURL = window.location.origin;

  async function fetchPunches() {
    try {
      // call backend - will be unauthenticated read or can be protected if you wish
      const res = await axios.get(`${backendURL}/api/punches`);
      setPunches(res.data);
    } catch (err) {
      console.error('fetchPunches', err);
    }
  }

  useEffect(() => {
    fetchPunches();
  }, []);

  async function punchIn() {
    try {
      // Get an access token for our backend. For this simple setup, request the OIDC scopes.
      // If you created an API and exposed scopes, you should request that scope instead.
      const request = {
        scopes: ["openid", "profile", "email"]
      };

      // Acquire token silently (or interactive fallback)
      let result;
      try {
        result = await instance.acquireTokenSilent({
          ...request,
          account
        });
      } catch (e) {
        // interactive fallback
        result = await instance.acquireTokenPopup(request);
      }

      const token = result.accessToken;
      const timeToSave = manualTime || new Date().toISOString();

      await axios.post(`${backendURL}/api/punch`, { time: timeToSave }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setManualTime('');
      fetchPunches();
    } catch (err) {
      console.error('punchIn error', err);
      alert('Failed to punch in. Check console.');
    }
  }

  return (
    <div className="container">
      <h2>⏰ Punch In App</h2>

      <AuthenticatedTemplate>
        <p>Signed in as: <strong>{account ? account.username : 'Unknown'}</strong></p>
        <SignOutButton />
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <p>Please sign-in to Punch In</p>
        <SignInButton />
      </UnauthenticatedTemplate>

      <p><strong>Local Time:</strong> {new Date().toLocaleString()}</p>

      <input
        type="text"
        placeholder="Optional manual time (ISO or readable string)"
        value={manualTime}
        onChange={(e) => setManualTime(e.target.value)}
      />

      <div>
        <button onClick={punchIn}>Punch In</button>
      </div>

      <h3>Recent Punches</h3>
      <ul style={{ textAlign: 'left' }}>
        {punches.map((p, i) => (<li key={i}>{p.time} {p.user ? `(${p.user})` : ''}</li>))}
      </ul>
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







