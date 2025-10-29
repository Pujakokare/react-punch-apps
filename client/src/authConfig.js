// client/src/authConfig.js
export const msalConfig = {
  auth: {
    clientId: "1e8189e9-e9a6-4b1c-b1ba-0a827bea564f",          // from Azure app
    authority: "https://login.microsoftonline.com/ed5a80e6-e7e0-45f7-b0d0-a026d48e56f0",
    redirectUri: window.location.origin
  },
  cache: { cacheLocation: "localStorage", storeAuthStateInCookie: false }
};

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};
