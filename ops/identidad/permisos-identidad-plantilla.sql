-- Plantilla para revisión: aplicar solo después de crear y validar el rol dedicado.
-- Ejecutar con psql, pasando el identificador como variable rol_servicio.
GRANT CONNECT ON DATABASE imi_identidad TO :"rol_servicio";
GRANT USAGE ON SCHEMA identidad TO :"rol_servicio";
GRANT SELECT ON identidad.usuarios,identidad.credenciales,identidad.accesos,identidad.tableros,identidad.rangos,identidad.recuperaciones,identidad.limites_acceso TO :"rol_servicio";
GRANT INSERT (usuario,nombres,apellidos,correo,organizacion,puesto,activo) ON identidad.usuarios TO :"rol_servicio";
GRANT UPDATE (nombres,apellidos,correo,organizacion,puesto,version_sesion,actualizado_en) ON identidad.usuarios TO :"rol_servicio";
GRANT INSERT (usuario_id,password_hash,algoritmo) ON identidad.credenciales TO :"rol_servicio";
GRANT UPDATE (password_hash,algoritmo,actualizado_en) ON identidad.credenciales TO :"rol_servicio";
GRANT INSERT (usuario_id,tablero_id,rango_id,activo) ON identidad.accesos TO :"rol_servicio";
GRANT UPDATE (rango_id,activo,actualizado_en) ON identidad.accesos TO :"rol_servicio";
GRANT INSERT,UPDATE,DELETE ON identidad.recuperaciones TO :"rol_servicio";
GRANT INSERT,UPDATE ON identidad.limites_acceso TO :"rol_servicio";
GRANT INSERT ON identidad.auditoria TO :"rol_servicio";
GRANT USAGE ON ALL SEQUENCES IN SCHEMA identidad TO :"rol_servicio";
