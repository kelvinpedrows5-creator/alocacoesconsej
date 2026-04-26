ALTER TABLE public.client_status_lights
  ADD COLUMN IF NOT EXISTS nps_score INTEGER CHECK (nps_score IS NULL OR (nps_score >= 0 AND nps_score <= 10)),
  ADD COLUMN IF NOT EXISTS csat_score INTEGER CHECK (csat_score IS NULL OR (csat_score >= 1 AND csat_score <= 5)),
  ADD COLUMN IF NOT EXISTS csi_score INTEGER CHECK (csi_score IS NULL OR (csi_score >= 0 AND csi_score <= 10));