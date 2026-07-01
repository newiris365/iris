-- Add composite index for bus_tracking latest-row queries
-- Prevents full table scan when fetching latest position of a bus
CREATE INDEX IF NOT EXISTS idx_bus_tracking_latest ON bus_tracking(bus_id, timestamp DESC);

-- Nightly archival job (run via pg_cron or external cron)
-- Archive rows older than 7 days to keep the hot table small
-- CREATE TABLE IF NOT EXISTS bus_tracking_archive (LIKE bus_tracking INCLUDING ALL);
-- INSERT INTO bus_tracking_archive SELECT * FROM bus_tracking WHERE timestamp < NOW() - INTERVAL '7 days';
-- DELETE FROM bus_tracking WHERE timestamp < NOW() - INTERVAL '7 days';