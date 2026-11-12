# DT-04: variables relevadas

Este cambio requiere la migración `001_variables_activas.sql` en la base `imi_activos_digitales` antes de iniciar la nueva versión de la app. El arranque no ejecuta cambios de esquema. La migración es idempotente: inicializa las 11 variables sin sobrescribir estados que ya se hayan modificado y conserva los cortes anteriores como cobertura completa (100 puntos).

## Publicación

1. Respaldar la base de datos antes de modificar el esquema.
2. Ejecutar `001_variables_activas.sql` con una cuenta autorizada sobre `imi_activos_digitales`.
3. Verificar que `digital_variable_estados` tenga 11 filas: A1–A5 y B1–B3 activas; B4–B6 en relevamiento.
4. Si la migración se ejecutó con un rol distinto del usuario de la app (`DATOS_USER`), otorgar a ese usuario `SELECT` en ambas tablas nuevas, `UPDATE` en `digital_variable_estados`, `INSERT` en `digital_variable_estado_historial` y `USAGE` en su secuencia `digital_variable_estado_historial_id_seq`. La aplicación no necesita crear ni borrar filas de estado.
5. Publicar la app y comprobar el índice, una ficha, la matriz, el CSV y un corte en un entorno de prueba. Los cambios de estado deben probarse en una copia de la base; no alteran observaciones existentes.

El máximo activo es interno y nunca aparece en la interfaz. El CSV sí lo incluye por requerimiento: `puntaje_maximo_activo` es el denominador del corte o del índice vigente y `puntaje_escala_100` es el puntaje total del organismo, repetido en cada fila de variable. Los cortes existentes conservan sus puntajes y se marcan con la cobertura anterior; los nuevos guardan la lista de variables activas y el máximo al cerrarse.

Los valores esperados del documento (índice 25,5; DPEC 64,4; categorías 26/14/1/0) corresponden a los datos del 10/11/2026. Con observaciones posteriores pueden variar.
