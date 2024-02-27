const mongodb = require("mongodb");

const Mongoclient = mongodb.MongoClient;

let mongodbUrl = "mongodb://localhost:27017";

if (process.env.MONGODB_URL) {
  mongodbUrl = process.env.MONGODB_URL;
}

let database;

async function initDb() {
  const client = await Mongoclient.connect(mongodbUrl);
  database = client.db("koteweb");
}

function getDb() {
  if (!database) {
    throw new Error("No database connected!");
  }

  return database;
}

module.exports = {
  initDb: initDb,
  getDb: getDb,
};
