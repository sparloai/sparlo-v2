-- Migration: sparlo_security_fixes
-- P1 Data Integrity: Add ON DELETE CASCADE to created_by foreign key
-- P2 Performance: Add composite indexes for common query patterns

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE sparlo_reports
DROP CONSTRAINT IF EXISTS sparlo_reports_created_by_fkey;

-- Add new constraint with ON DELETE CASCADE
-- When a user is deleted, their reports are also deleted
ALTER TABLE sparlo_reports
ADD CONSTRAINT sparlo_reports_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- P2: Add composite index for common list queries
-- This optimizes: SELECT * FROM sparlo_reports WHERE account_id = ? AND status = ? AND archived = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_sparlo_reports_account_status_archived
ON sparlo_reports(account_id, status, archived, created_at DESC);

-- P2: Add index for rate limiting queries
-- This optimizes: SELECT count(*) FROM sparlo_reports WHERE account_id = ? AND created_at >= ?
CREATE INDEX IF NOT EXISTS idx_sparlo_reports_account_created
ON sparlo_reports(account_id, created_at DESC);

-- Add comment explaining the constraints
COMMENT ON CONSTRAINT sparlo_reports_created_by_fkey ON sparlo_reports IS
'Cascade delete reports when user is deleted - user owns their data';
