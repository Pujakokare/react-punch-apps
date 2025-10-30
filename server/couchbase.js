// // couchbase.js
// const couchbase = require("couchbase");

// // Connect to Couchbase using environment variables
// const cluster = new couchbase.Cluster(process.env.COUCHBASE_CONNSTR, {
//   username: process.env.COUCHBASE_USERNAME,
//   password: process.env.COUCHBASE_PASSWORD,
// });

// const bucket = cluster.bucket(process.env.COUCHBASE_BUCKET);
// const collection = bucket.defaultCollection();

// module.exports = { cluster, bucket, collection };


// server/couchbase.js
const couchbase = require('couchbase');

let cluster;
let bucket;
let collection;

async function connectCouchbase() {
  if (cluster) return; // already connected
  try {
    cluster = await couchbase.connect(process.env.COUCHBASE_CONNSTR, {
      username: process.env.COUCHBASE_USERNAME,
      password: process.env.COUCHBASE_PASSWORD,
    });

    bucket = cluster.bucket(process.env.COUCHBASE_BUCKET);
    collection = bucket.defaultCollection();

    console.log('✅ Couchbase connected successfully');
  } catch (err) {
    console.error('❌ Couchbase connection failed:', err);
    throw err;
  }
}

function getCluster() {
  return cluster;
}

function getCollection() {
  return collection;
}

module.exports = { connectCouchbase, getCluster, getCollection };
