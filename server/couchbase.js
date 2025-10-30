// couchbase.js
const couchbase = require("couchbase");

// Connect to Couchbase using environment variables
const cluster = new couchbase.Cluster(process.env.COUCHBASE_CONNSTR, {
  username: process.env.COUCHBASE_USERNAME,
  password: process.env.COUCHBASE_PASSWORD,
});

const bucket = cluster.bucket(process.env.COUCHBASE_BUCKET);
const collection = bucket.defaultCollection();

module.exports = { cluster, bucket, collection };
