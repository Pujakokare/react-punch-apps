// client/src/authConfig.js
export const msalConfig = {
  auth: {
    clientId: "YOUR_CLIENT_ID_HERE",          // from Azure app
    authority: "https://login.microsoftonline.com/YOUR_TENANT_ID_HERE",
    redirectUri: window.location.origin
  },
  cache: { cacheLocation: "localStorage", storeAuthStateInCookie: false }
};

export const loginRequest = {
  scopes: ["User.Read"]
};
