BEGIN;

CREATE TABLE IF NOT EXISTS public.digital_variable_estados (
  variable_id varchar(2) PRIMARY KEY,
  estado varchar(20) NOT NULL CHECK (estado IN ('activa', 'en_relevamiento')),
  updated_by text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.digital_variable_estados (variable_id, estado, updated_by)
VALUES
  ('A1','activa','migracion_dt04'), ('A2','activa','migracion_dt04'),
  ('A3','activa','migracion_dt04'), ('A4','activa','migracion_dt04'),
  ('A5','activa','migracion_dt04'), ('B1','activa','migracion_dt04'),
  ('B2','activa','migracion_dt04'), ('B3','activa','migracion_dt04'),
  ('B4','en_relevamiento','migracion_dt04'),
  ('B5','en_relevamiento','migracion_dt04'),
  ('B6','en_relevamiento','migracion_dt04')
ON CONFLICT (variable_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.digital_variable_estado_historial (
  id serial PRIMARY KEY,
  variable_id varchar(2) NOT NULL REFERENCES public.digital_variable_estados(variable_id),
  estado_anterior varchar(20) NOT NULL CHECK (estado_anterior IN ('activa', 'en_relevamiento')),
  estado_nuevo varchar(20) NOT NULL CHECK (estado_nuevo IN ('activa', 'en_relevamiento')),
  usuario text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.digital_cortes
  ADD COLUMN IF NOT EXISTS variables_activas jsonb NOT NULL DEFAULT '["A1","A2","A3","A4","A5","B1","B2","B3","B4","B5","B6"]'::jsonb;
ALTER TABLE public.digital_cortes
  ADD COLUMN IF NOT EXISTS maximo_activo integer NOT NULL DEFAULT 100;

COMMIT;
