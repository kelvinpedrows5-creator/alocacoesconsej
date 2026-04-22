-- Tornar o bucket de contratos público novamente
UPDATE storage.buckets SET public = true WHERE id = 'contracts';

-- Remover políticas restritivas de leitura
DROP POLICY IF EXISTS "Admins can read contracts" ON storage.objects;
DROP POLICY IF EXISTS "GT members can read their client contracts" ON storage.objects;
DROP POLICY IF EXISTS "Leaders can read contracts" ON storage.objects;

-- Permitir leitura pública dos contratos
CREATE POLICY "Anyone can view contracts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'contracts');