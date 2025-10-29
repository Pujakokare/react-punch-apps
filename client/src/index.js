import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";

const msalConfig = {
  auth: {
    clientId: "1e8189e9-e9a6-4b1c-b1ba-0a827bea564f", // 🔹 Replace this with your Azure App ID
    //authority: "https://login.microsoftonline.com/common",
    authority: "https://login.microsoftonline.com/ed5a80e6-e7e0-45f7-b0d0-a026d48e56f0",
    redirectUri: window.location.origin,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

async function renderApp() {
  try {
    // 👇 Ensure MSAL is initialized before rendering
    await msalInstance.initialize();

    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </React.StrictMode>
    );
  } catch (err) {
    console.error("❌ MSAL failed to initialize:", err);
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <div
        style={{
          display: "flex",
          height: "100vh",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          color: "#fff",
          background:
            "linear-gradient(135deg, #667eea, #764ba2, #6B8DD6, #8E37D7)",
        }}
      >
        <h2>⚠️ App initialization failed</h2>
        <p>{err.message}</p>
      </div>
    );
  }
}

// Run it
renderApp();


// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App';
// import './App.css';

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(<App />);
