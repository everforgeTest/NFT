const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const settings = require('../settings.json').settings;
const Tables = require('../Constants/Tables');

class DBInitializer {
  static #db = null;

  static async init() {
    if (!fs.existsSync(settings.dbPath)) {
      this.#db = new sqlite3.Database(settings.dbPath);
      await this.#runQuery('PRAGMA foreign_keys = ON');

      await this.#runQuery(`CREATE TABLE IF NOT EXISTS ${Tables.CONTRACTVERSION} (\
        Id INTEGER,\
        Version FLOAT NOT NULL,\
        Description TEXT,\
        CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,\
        LastUpdatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,\
        PRIMARY KEY(\"Id\" AUTOINCREMENT)\
      )`);

      await this.#runQuery(`CREATE TABLE IF NOT EXISTS ${Tables.NFTS} (\
        Id INTEGER,\
        TokenId TEXT UNIQUE,\
        Name TEXT NOT NULL,\
        Metadata TEXT,\
        OwnerPubKey TEXT NOT NULL,\
        MintedOn DATETIME DEFAULT CURRENT_TIMESTAMP,\
        Burned INTEGER DEFAULT 0,\
        ConcurrencyKey TEXT,\
        PRIMARY KEY(\"Id\" AUTOINCREMENT)\
      )`);

      this.#db.close();
    }

    if (fs.existsSync(settings.dbPath)) {
      // Reserved for future migrations (Scripts folder)
      const scriptsFolder = path.join('.', 'src', 'Data.Deploy', 'Scripts');
      if (!fs.existsSync(scriptsFolder)) {
        try { fs.mkdirSync(scriptsFolder, { recursive: true }); } catch (_) {}
      }
    }
  }

  static #runQuery(query, params = null) {
    return new Promise((resolve, reject) => {
      this.#db.run(query, params ? params : [], function (err) {
        if (err) return reject(err);
        resolve({ lastId: this.lastID, changes: this.changes });
      });
    });
  }
}

module.exports = { DBInitializer };
