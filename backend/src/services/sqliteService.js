import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database file
const dbPath = join(__dirname, '../../listify.db');
const db = new Database(dbPath);

// Initialize tables
export function initializeDatabase() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_type TEXT NOT NULL,
      source_metadata TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      item_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS list_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      category TEXT DEFAULT 'other',
      quantity TEXT,
      notes TEXT,
      status TEXT DEFAULT 'active',
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);
    CREATE INDEX IF NOT EXISTS idx_list_items_status ON list_items(status);
    CREATE INDEX IF NOT EXISTS idx_list_items_category ON list_items(category);
  `);

  console.log('✅ SQLite database initialized at:', dbPath);
}

export async function saveListItems(items, source = 'image', sourceMetadata = null) {
  const insertList = db.prepare(`
    INSERT INTO lists (source_type, source_metadata, created_at, item_count)
    VALUES (?, ?, datetime('now'), ?)
  `);

  const listInfo = insertList.run(
    source,
    sourceMetadata ? JSON.stringify(sourceMetadata) : null,
    items.length
  );

  const listId = listInfo.lastInsertRowid;

  const insertItem = db.prepare(`
    INSERT INTO list_items (
      list_id, item_name, category, quantity,
      notes, status, created_at
    )
    VALUES (?, ?, ?, ?, ?, 'active', datetime('now'))
  `);

  for (const item of items) {
    insertItem.run(
      listId,
      item.item_name,
      item.category,
      item.quantity,
      item.notes
    );
  }

  return { listId, itemCount: items.length, items };
}

export async function getLists(limit = 50) {
  const stmt = db.prepare(`
    SELECT id, source_type, source_metadata,
           created_at, item_count, updated_at
    FROM lists
    ORDER BY created_at DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

export async function getListItems(listId) {
  const stmt = db.prepare(`
    SELECT id, item_name, category, quantity,
           notes, status, completed_at,
           created_at, updated_at
    FROM list_items
    WHERE list_id = ?
    ORDER BY created_at ASC
  `);
  return stmt.all(listId);
}

export async function updateListItem(itemId, updates) {
  const allowedFields = ['item_name', 'category', 'quantity', 'notes', 'status', 'completed_at'];
  const updateFields = [];
  const params = [];

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      updateFields.push(`${key} = ?`);
      params.push(updates[key]);
    }
  });

  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }

  updateFields.push('updated_at = datetime(\'now\')');
  params.push(itemId);

  const stmt = db.prepare(`
    UPDATE list_items
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...params);

  const fetchStmt = db.prepare('SELECT * FROM list_items WHERE id = ?');
  return fetchStmt.get(itemId);
}

export async function deleteListItem(itemId) {
  const stmt = db.prepare('DELETE FROM list_items WHERE id = ?');
  return stmt.run(itemId);
}

export async function searchListItems(keyword) {
  const stmt = db.prepare(`
    SELECT li.id, li.list_id, li.item_name, li.category,
           li.quantity, li.notes, li.status,
           l.source_type, l.created_at as list_created_at
    FROM list_items li
    JOIN lists l ON li.list_id = l.id
    WHERE li.item_name LIKE ? OR li.notes LIKE ?
    ORDER BY li.created_at DESC
    LIMIT 100
  `);
  const searchTerm = `%${keyword}%`;
  return stmt.all(searchTerm, searchTerm);
}

export async function getStatistics() {
  const statsStmt = db.prepare(`
    SELECT
      COUNT(DISTINCT l.id) as total_lists,
      COUNT(li.id) as total_items,
      COUNT(CASE WHEN li.status = 'active' THEN 1 END) as active_items,
      COUNT(CASE WHEN li.status = 'completed' THEN 1 END) as completed_items
    FROM lists l
    LEFT JOIN list_items li ON l.id = li.list_id
  `);

  const categoryStmt = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM list_items
    GROUP BY category
    ORDER BY count DESC
  `);

  const stats = statsStmt.get();
  const categories = categoryStmt.all();

  return { ...stats, categories };
}

export default db;
