-- Add notification preferences to profiles table
ALTER TABLE profiles 
ADD COLUMN email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN notification_threshold INTEGER NOT NULL DEFAULT 75;

-- Add check constraint for threshold boundary safety
ALTER TABLE profiles
ADD CONSTRAINT chk_notification_threshold CHECK (notification_threshold BETWEEN 0 AND 100);
