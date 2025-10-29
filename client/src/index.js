import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";

const msalConfig = {
  auth: {
    clientId: "YOUR_AZURE_AD_CLIENT_ID",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

async function initMSAL() {
  // Ensure MSAL is initialized before rendering app
  await msalInstance.initialize();

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  );
}

initMSAL();



// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App';
// import './App.css';

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(<App />);
