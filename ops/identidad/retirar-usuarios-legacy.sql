-- Retira la tabla local de autenticación de Activos luego de respaldarla y
-- verificar el archivo con pg_restore --list.
-- No usar CASCADE: si aparece una dependencia, la operación debe detenerse.
BEGIN;
LOCK TABLE public.usuarios_imi IN ACCESS EXCLUSIVE MODE;

DO $guard$
DECLARE
  total_legacy integer;
  activos_legacy integer;
  admin_anterior_inactivo boolean;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE activo)
    INTO total_legacy, activos_legacy
    FROM public.usuarios_imi;

  SELECT EXISTS (
    SELECT 1 FROM public.usuarios_imi
    WHERE lower(btrim(username)) = 'admin_mzalazar' AND NOT activo
  ) INTO admin_anterior_inactivo;

  IF total_legacy <> 8 OR activos_legacy <> 7 OR NOT admin_anterior_inactivo THEN
    RAISE EXCEPTION 'El estado legado cambió; se cancela el retiro (total %, activos %, admin anterior inactivo %)',
      total_legacy, activos_legacy, admin_anterior_inactivo;
  END IF;
END
$guard$;

DROP TABLE public.usuarios_imi RESTRICT;
COMMIT;
