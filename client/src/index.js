import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";

const msalConfig = {
  auth: {
    clientId: "1e8189e9-e9a6-4b1c-b1ba-0a827bea564f",
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
