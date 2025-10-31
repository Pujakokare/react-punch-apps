// // client/src/App.js
// import React, { useState, useEffect } from "react";
// import { PublicClientApplication, InteractionType } from "@azure/msal-browser";
// import { MsalProvider, useMsal, useAccount } from "@azure/msal-react";

// const msalConfig = {
//   auth: {
//     clientId: process.env.REACT_APP_CLIENT_ID,
//     authority: `https://login.microsoftonline.com/${process.env.REACT_APP_TENANT_ID}`,
//     redirectUri: window.location.origin,
//   },
// };

// const pca = new PublicClientApplication(msalConfig);

// function PunchApp() {
//   const { instance, accounts } = useMsal();
//   const account = useAccount(accounts[0] || {});
//   const [punches, setPunches] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // Fetch recent punches
//   useEffect(() => {
//     fetch(`${process.env.REACT_APP_BACKEND_URL}/api/punches`)
//       .then((res) => res.json())
//       .then((data) => setPunches(data))
//       .catch((err) => console.error("Error fetching punches:", err));
//   }, []);

//   const handlePunch = async () => {
//     setLoading(true);
//     try {
//       let tokenResponse;
//       if (!account) {
//         const loginResponse = await instance.loginPopup({
//           scopes: ["User.Read"],
//         });
//         tokenResponse = loginResponse.accessToken;
//       } else {
//         const response = await instance.acquireTokenSilent({
//           scopes: ["User.Read"],
//           account: account,
//         });
//         tokenResponse = response.accessToken;
//       }

//       const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/punch`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${tokenResponse}`,
//         },
//       });

//       if (res.ok) {
//         alert("✅ Punch recorded successfully!");
//         const data = await res.json();
//         setPunches([data, ...punches]);
//       } else {
//         alert("❌ Failed to punch in. Check console.");
//         console.error(await res.text());
//       }
//     } catch (err) {
//       console.error("Punch error:", err);
//       alert("❌ Failed to punch in. Check console.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-6 text-center">
//       <h1>🏢 Punch Time Tracker</h1>
//       {account ? (
//         <p>Welcome, {account.username}</p>
//       ) : (
//         <p>Sign in will occur when you press “Punch In”.</p>
//       )}

//       <button onClick={handlePunch} disabled={loading}>
//         {loading ? "Processing..." : "Punch In"}
//       </button>

//       <h3 style={{ marginTop: "20px" }}>Punch Log</h3>
//       <table border="1" style={{ margin: "auto", width: "70%" }}>
//         <thead>
//           <tr>
//             <th>#</th>
//             <th>Time</th>
//             <th>By</th>
//           </tr>
//         </thead>
//         <tbody>
//           {punches.map((p, i) => (
//             <tr key={p.id || i}>
//               <td>{i + 1}</td>
//               <td>{new Date(p.createdAt).toLocaleString()}</td>
//               <td>{p.user || "-"}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default function App() {
//   return (
//     <MsalProvider instance={pca}>
//       <PunchApp />
//     </MsalProvider>
//   );
// }








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
    if (hour < 12) return "🌞 Good morning! Have a productive day ahead.";
    if (hour < 17) return "🌤️ Good afternoon! Keep up the great work.";
    return "🌙 Good evening! Great job finishing strong today.";
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







