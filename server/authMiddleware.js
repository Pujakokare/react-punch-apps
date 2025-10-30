// server/authMiddleware.js
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');

const tenantId = process.env.AZURE_TENANT_ID;
const audience = process.env.AZURE_CLIENT_ID; // the client id of the SPA - token's aud should match
const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;

const client = jwksRsa({
  jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

function validateToken(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const match = auth.match(/^Bearer (.+)$/);
  if (!match) return res.status(401).json({ error: 'Missing or malformed token' });

  const token = match[1];

  jwt.verify(token, getKey, {
    audience: audience,
    issuer: issuer,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      console.error('Token verification failed', err);
      return res.status(401).json({ error: 'Invalid token' });
    }
    // decoded contains claims like oid, sub, preferred_username
    req.user = decoded;
    next();
  });
}

module.exports = { validateToken };
