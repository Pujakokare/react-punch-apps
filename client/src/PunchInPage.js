import React, { useState, useEffect } from "react";

export default function PunchInPage() {
  const [punches, setPunches] = useState([]);
  const [message, setMessage] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [useManual, setUseManual] = useState(false);

  // Load previous punch-ins from local storage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("punches")) || [];
    setPunches(stored);
  }, []);

  // Save punch-ins to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem("punches", JSON.stringify(punches));
  }, [punches]);

  // Personalized time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "🌞 Good Morning!";
    if (hour < 18) return "🌤 Good Afternoon!";
    return "🌙 Good Evening!";
  };

  const handlePunchIn = () => {
    const now = new Date();
    const punchTime = useManual ? manualTime : now.toLocaleTimeString();
    const date = now.toLocaleDateString();

    if (!punchTime) {
      alert("Please enter time manually or enable local time.");
      return;
    }

    const newRecord = { date, time: punchTime };
    const updatedPunches = [newRecord, ...punches];
    setPunches(updatedPunches);
    setMessage(`✅ ${getGreeting()} Punch-in recorded at ${punchTime}`);
    setManualTime("");
    setUseManual(false);
  };

  return (
    <div className="punch-container">
      <h1 className="title">🕒 Punch In Dashboard</h1>
      <p className="greeting-text">{getGreeting()}</p>

      <div className="punch-card">
        <label>
          <input
            type="checkbox"
            checked={useManual}
            onChange={() => setUseManual(!useManual)}
          />
          Enter time manually
        </label>

        {useManual && (
          <input
            type="time"
            value={manualTime}
            onChange={(e) => setManualTime(e.target.value)}
          />
        )}

        <button className="punch-btn" onClick={handlePunchIn}>
          Punch In
        </button>

        {message && <div className="success-msg">{message}</div>}
      </div>

      <div className="table-container">
        <h2>Your Punch Records</h2>
        {punches.length === 0 ? (
          <p>No records yet.</p>
        ) : (
          <table className="punch-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {punches.map((p, i) => (
                <tr key={i}>
                  <td>{p.date}</td>
                  <td>{p.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
