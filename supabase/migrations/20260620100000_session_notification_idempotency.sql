-- Add idempotency tracking to search_sessions
ALTER TABLE search_sessions 
ADD COLUMN notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN notification_sent_at TIMESTAMPTZ NULL;
