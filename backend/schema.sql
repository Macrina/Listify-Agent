-- Listify Agent Database Schema
-- Run this SQL in your AgentDB dashboard to set up the database

-- Create lists table
CREATE TABLE IF NOT EXISTS lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL,
  source_metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  item_count INTEGER DEFAULT 0
);

-- Create list_items table
CREATE TABLE IF NOT EXISTS list_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  quantity TEXT,
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  status TEXT DEFAULT 'active',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_status ON list_items(status);
CREATE INDEX IF NOT EXISTS idx_list_items_category ON list_items(category);

-- Verify tables were created
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
