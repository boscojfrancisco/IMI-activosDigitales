# Identidad central para Activos Digitales

## Estado del corte — 9 de noviembre de 2026

El primer corte supervisado quedó confirmado con el commit `4db9cc0`. Se conservó el formulario y la URL de ingreso de Activos; la validación de usuario y contraseña ahora consulta `imi_identidad`. Los ocho accesos centrales coinciden con el origen: dos administradores y seis editores. Se admite también el alias anterior `admin_mzalazar` de la identidad central `mzalazar`.

La tabla `public.usuarios_imi` de `imi_activos_digitales` sigue intacta para contingencia. No se borró la tabla ni se consolidaron las bases de negocio. La migración de este corte solo cambia la fuente de autenticación del tablero.

La app quedó con `IMI_SOLO_LECTURA=no` para habilitar operaciones del tablero y `IMI_CONGELAR_IDENTIDAD=si` para pausar altas, cambios de contraseña y permisos desde esta integración durante la observación. La congelación no impide cambios hechos desde otros servicios o herramientas; coordinarlos mientras se define la reversión de credenciales.

El endpoint de salud respondió `{"servicio":"imi-activos-identidad","estado":"ok"}` en EC2 y por la URL pública. GitHub Actions compiló el commit; el job de deploy automático estaba desactivado y se omitió. El despliegue se hizo con el coordinador y el runner de reversión bajo bloqueo.

Respaldos del corte, restaurados en bases temporales aisladas y verificados: `/var/backups/imi/identidad/imi_activos_digitales_revision_corte_20261109T143350Z.dump` y `/var/backups/imi/identidad/imi_identidad_revision_corte_20261109T143350Z.dump`. La restauración recuperó ocho usuarios, dos rangos de administrador y seis de editor, ocho migraciones y ocho accesos activos; las bases temporales se eliminaron al terminar. La copia de la aplicación anterior, dependencias y configuración está en `/home/ubuntu/.imi-activos-pre-corte-20261109`.

Se retiró el rol operativo y el archivo temporal de credenciales usados para el bloqueo. La app mantiene solo lectura del mapeo de alias requerido por el login. La clave HMAC de verificación permanece protegida en el servidor para conciliaciones futuras.

## Configuración

El servidor lee `.env.integrado.local` desde el directorio de la aplicación. Debe contener `IMI_INTEGRACION=si`, variables `IDENTIDAD_*`, `DATOS_*` y `PILOTO_JWT_SECRET`; las bases esperadas son `imi_identidad` e `imi_activos_digitales`. Ambas conexiones usan TLS con certificados verificados. No copiar contraseñas ni claves al repositorio.

`VITE_BASE_PATH=/imi-activos/` se conserva en la compilación. La clave de sesión debe ser aleatoria, estable y tener al menos 48 caracteres. El archivo de configuración debe permanecer restringido al usuario de servicio y tener respaldo protegido.

El rol de datos del tablero no tiene acceso a la tabla anterior de usuarios. El rol de identidad no puede cambiar `es_admin_global`, emitir invitaciones iniciales ni borrar auditoría. El acceso de lectura a `identidad.equivalencias_activos` permite resolver los nombres de usuario anteriores; no habilita cambios de usuarios.

## Reversión y siguientes pasos

El corte validó bajo bloqueo las ocho huellas, las correspondencias, los estados y los rangos antes y después del despliegue. Si se necesita volver a la versión anterior durante la observación, usar el respaldo de la aplicación y la configuración indicados arriba; no restaurar una copia sobre las bases productivas.

Antes de permitir cambios de usuarios o contraseñas, definir cómo conciliarlos con `public.usuarios_imi`. Al volver a la app antigua, las contraseñas que se cambien solo en identidad no pueden reconstruirse desde sus hashes. No borrar la tabla anterior hasta que termine la observación y la reversión esté acordada.

1. Confirmar en producción el ingreso al tablero con `mzalazar` y con una cuenta no administradora usando las credenciales centrales; no enviar contraseñas por chat.
2. Observar errores de login y operaciones habituales del tablero.
3. Mantener los cambios de identidad congelados en Activos mientras se concilia esta etapa. Salud queda fuera de este corte; Copa y otros tableros requieren su propio inventario y transición.
