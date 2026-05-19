-- ============================================
-- Migration: app_config table
-- Stores key-value configuration for the app:
-- azure_sso config, webhooks list, etc.
-- ============================================

CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only admins can read/write app_config
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage app_config"
    ON app_config FOR ALL TO authenticated
    USING (get_my_role() = 'admin');

-- Auto-update updated_at on change
CREATE OR REPLACE FUNCTION update_app_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_config_updated_at
    BEFORE UPDATE ON app_config
    FOR EACH ROW EXECUTE FUNCTION update_app_config_timestamp();
