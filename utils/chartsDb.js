const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../charts_db.json');

function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ charts: [], studyTemplates: [] }, null, 2), 'utf8');
  }
}

function readDb() {
  initDb();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading charts DB file:", err);
    return { charts: [], studyTemplates: [] };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing charts DB file:", err);
  }
}

module.exports = {
  readDb,
  writeDb
};
