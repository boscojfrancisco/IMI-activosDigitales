# Identidad central para Activos Digitales

## Estado del corte — 9 de noviembre de 2026

El primer corte supervisado quedó confirmado con el commit `4db9cc0`. Se conservó el formulario y la URL de ingreso de Activos; la validación de usuario y contraseña ahora consulta `imi_identidad`. Los ocho accesos centrales coinciden con el origen: dos administradores y seis editores. La equivalencia histórica `admin_mzalazar` → `mzalazar` dejó de aceptarse como nombre de ingreso en el commit `18155b4`, confirmado en producción el 9 de noviembre de 2026. No existe una identidad central separada llamada `admin_mzalazar`; el mapeo se conserva solo como dato histórico para conciliación.

El titular confirmó el ingreso correcto de las ocho cuentas en producción. Luego se retiró `public.usuarios_imi` de `imi_activos_digitales` mediante una transacción con bloqueo y `DROP ... RESTRICT`; la tabla no tenía vistas, triggers ni claves foráneas dependientes. No se consolidaron las bases de negocio.

Antes del retiro se creó y restauró en una base temporal aislada el respaldo `/var/backups/imi/identidad/usuarios_imi_antes_retiro_20261109T162646Z.dump`. La restauración verificó los ocho registros (siete activos y uno inactivo). SHA-256: `0a94d9a7351ed3b056960ca8e1ad2dd43b4960bd5d097cdd8d2f04323d8d7811`. El archivo tiene permisos `0600` y pertenece a `root`.

La app quedó con `IMI_SOLO_LECTURA=no` para habilitar operaciones del tablero y `IMI_CONGELAR_IDENTIDAD=si` para pausar altas, cambios de contraseña y permisos desde esta integración durante la observación. La congelación no impide cambios hechos desde otros servicios o herramientas; coordinarlos mientras se define la reversión de credenciales.

El retiro de las referencias heredadas se publicó en el commit `a494e9f`. `npm run lint` y `npm run build` pasaron. El runner de despliegue guardó el build y dependencias anteriores, recargó la aplicación y verificó salud. Después del retiro, los endpoints públicos de salud y organismos respondieron HTTP 200 y se cargaron 41 organismos.

Respaldos del corte, restaurados en bases temporales aisladas y verificados: `/var/backups/imi/identidad/imi_activos_digitales_revision_corte_20261109T143350Z.dump` y `/var/backups/imi/identidad/imi_identidad_revision_corte_20261109T143350Z.dump`. La restauración recuperó ocho usuarios, dos rangos de administrador y seis de editor, ocho migraciones y ocho accesos activos; las bases temporales se eliminaron al terminar. La copia de la aplicación anterior, dependencias y configuración está en `/home/ubuntu/.imi-activos-pre-corte-20261109`.

Se retiró el rol operativo y el archivo temporal de credenciales usados para el bloqueo. El rol de la app ya no puede leer `identidad.equivalencias_activos`; se verificó que el permiso quedó revocado y que `mzalazar` sigue activo como administrador global. La clave HMAC de verificación permanece protegida en el servidor para conciliaciones futuras.

Las sesiones de Activos usan JWT de 12 horas validados contra `imi_identidad`. Los permisos y la versión de sesión se siguen comprobando en la base central en cada petición autenticada. No hay renovación automática: al vencer el token se debe iniciar sesión nuevamente.

## Configuración

El servidor lee `.env.integrado.local` desde el directorio de la aplicación. Debe contener `IMI_INTEGRACION=si`, variables `IDENTIDAD_*`, `DATOS_*` y `PILOTO_JWT_SECRET`; las bases esperadas son `imi_identidad` e `imi_activos_digitales`. Ambas conexiones usan TLS con certificados verificados. No copiar contraseñas ni claves al repositorio.

`VITE_BASE_PATH=/imi-activos/` se conserva en la compilación. La clave de sesión debe ser aleatoria, estable y tener al menos 48 caracteres. El archivo de configuración debe permanecer restringido al usuario de servicio y tener respaldo protegido.

El rol de identidad no puede cambiar `es_admin_global`, emitir invitaciones iniciales ni borrar auditoría. La aplicación ya no define ni consulta `public.usuarios_imi`. No usa `identidad.equivalencias_activos` para autenticar; el mapeo se conserva para conciliación.

## Reversión y siguientes pasos

El corte validó bajo bloqueo las ocho huellas, las correspondencias, los estados y los rangos antes y después del despliegue. Si se necesita volver a la autenticación anterior, restaurar únicamente la tabla desde el respaldo indicado y volver a una versión compatible; no restaurar una copia sobre toda la base productiva.

1. Mantener la observación de operaciones habituales y revisar errores de sesión o acceso.
2. Mantener el respaldo de `usuarios_imi` restringido y disponible durante la ventana de reversión.
3. Salud queda fuera de este corte; Copa y otros tableros requieren su propio inventario y transición.
