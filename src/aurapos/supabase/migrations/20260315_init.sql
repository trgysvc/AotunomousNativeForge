CREATE EXTENSION IF NOT EXISTS pg_partman;

-- Ensure storage bucket exists (additive, zero‑downtime)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('assets', 'assets', true, 52428800, ARRAY['image/png','image/jpeg','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Additive table creation (if not exists)
CREATE TABLE IF NOT EXISTS public.events (
    id BIGSERIAL PRIMARY KEY,
    event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    payload JSONB
);

-- Set up pg_partman for daily partitioning of events (additive, non‑blocking)
SELECT partman.create_parent(
    p_parent_table := 'public.events',
    p_control := 'event_time',
    p_type := 'time',
    p_interval := '1 day',
    p_start_partition := TO_CHAR(NOW() - INTERVAL '30 days', 'YYYY-MM-DD') || ' 00:00:00',
    p_retention := NULL,
    p_retention_schema := NULL,
    p_jobmon := true
);