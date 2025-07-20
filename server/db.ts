import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "../shared/schema";

const DATABASE_URL = process.env.DATABASE_URL || 'sqlite://:memory:';

let db: ReturnType<typeof drizzle>;

try {
  if (DATABASE_URL === 'sqlite://:memory:') {
    console.log('EmotionalChain: Using in-memory SQLite database');
    const sqlite = new Database(':memory:');
    db = drizzle(sqlite, { schema });
    
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS validators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT UNIQUE NOT NULL,
        stake INTEGER NOT NULL,
        biometric_device TEXT NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reputation REAL DEFAULT 100,
        total_blocks INTEGER DEFAULT 0,
        missed_blocks INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        fitbit_user_id TEXT,
        fitbit_access_token TEXT,
        fitbit_refresh_token TEXT
      );
      
      CREATE TABLE IF NOT EXISTS emotional_proofs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        validator_address TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        heart_rate INTEGER NOT NULL,
        hrv REAL,
        stress_level REAL NOT NULL,
        energy_level REAL NOT NULL,
        focus_level REAL NOT NULL,
        authenticity_score REAL NOT NULL,
        biometric_hash TEXT NOT NULL,
        signature TEXT NOT NULL,
        raw_biometric_data TEXT
      );
      
      CREATE TABLE IF NOT EXISTS consensus_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        block_height INTEGER UNIQUE NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        network_stress REAL NOT NULL,
        network_energy REAL NOT NULL,
        network_focus REAL NOT NULL,
        network_authenticity REAL NOT NULL,
        agreement_score REAL NOT NULL,
        participating_validators INTEGER NOT NULL,
        total_stake INTEGER NOT NULL,
        consensus_reached BOOLEAN NOT NULL,
        validator_proofs TEXT
      );
      
      CREATE TABLE IF NOT EXISTS network_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        metadata TEXT
      );
    `);
    
    console.log('EmotionalChain: In-memory database tables created');
    
  } else if (DATABASE_URL.startsWith('sqlite:')) {
    const dbPath = DATABASE_URL.replace('sqlite:', '');
    console.log(`EmotionalChain: Using SQLite database at ${dbPath}`);
    const sqlite = new Database(dbPath);
    db = drizzle(sqlite, { schema });
    
  } else {
    throw new Error(`Unsupported database URL: ${DATABASE_URL}`);
  }
  
} catch (error) {
  console.error('EmotionalChain: Database initialization failed:', error);
  
  console.log('EmotionalChain: Falling back to in-memory database');
  const sqlite = new Database(':memory:');
  db = drizzle(sqlite, { schema });
  
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS validators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT UNIQUE NOT NULL,
      stake INTEGER NOT NULL,
      biometric_device TEXT NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reputation REAL DEFAULT 100,
      total_blocks INTEGER DEFAULT 0,
      missed_blocks INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      fitbit_user_id TEXT,
      fitbit_access_token TEXT,
      fitbit_refresh_token TEXT
    );
  `);
}

export { db };