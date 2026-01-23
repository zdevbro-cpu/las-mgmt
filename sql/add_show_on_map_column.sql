-- Add show_on_map column to branches table with default value true
ALTER TABLE branches ADD COLUMN IF NOT EXISTS show_on_map BOOLEAN DEFAULT TRUE;
