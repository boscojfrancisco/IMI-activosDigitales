# Reglas y Guías para el Proyecto IMI Activos

Este archivo contiene las directrices, reglas de desarrollo y especificaciones del Índice de Madurez Digital Provincial (IMDP) de la Provincia de Corrientes. Cualquier agente de IA que trabaje en esta base de código debe respetar estrictamente estas directrices.

---

## 🛠️ Tecnologías y Arquitectura

* **Frontend**: React (v19) con Vite, TypeScript y estilos CSS nativos (Vite Tailwind CSS config).
* **Backend / API**: Servidor Express en `server.ts` compilado con `esbuild` en `dist/server.cjs` para producción.
* **Base de Datos**: PostgreSQL en producción.
  * **Motor Local/Producción**: `drizzle-orm/node-postgres` con el cliente `pg`.
  * **Acceso**: La conexión se realiza a través de la variable de entorno `DATABASE_URL` (nunca hardcodear credenciales en el código).
* **Despliegue**: Google Cloud Run (Serverless). El puerto se configura dinámicamente usando `process.env.PORT` con un fallback a `3000` en desarrollo.

---

## 📊 Reglas de Ponderación del IMDP

El Índice de Madurez Digital Provincial (IMDP) y sus 4 subíndices de gobierno se calculan en base a **14 variables activas** que suman exactamente **100% (100 puntos)**. La distribución es la siguiente:

### Eje 1: Servicios Ciudadanos (45% máximo)
* **Trámites Online**: 20%
* **Guía de Trámites**: 10%
* **Turnos Online**: 5%
* **Seguimiento Digital (Seguimiento de Trámites)**: 5%
* **Atención Digital**: 5%

### Eje 2: Eficiencia Interna (30% máximo)
* **Expediente Digital**: 10%
* **Tienen Firma Digital**: 10%
* **Contratado Doco (Implementado DOCO)**: 5%
* **Uso de SiiF**: 5%

### Eje 3: Identidad Web (15% máximo)
* **Sitio Web Oficial**: 10%
* **Sitio Web Propio (Dominio Propio)**: 5%

### Eje 4: Innovación y Procesos (10% máximo)
* **Analisis de Procesos con Gcia. Innovacion**: 5%
* **Tienen IA en sus procesos (Uso IA o Chatbot)**: 5%

---

## 🏷️ Renombrado de Etiquetas en Interfaz (Glosario)

Para mantener la consistencia con el vocabulario del organismo, se deben usar siempre estos términos exactos en formularios, leyendas, filtros, tablas y textos explicativos:

* **Contratado Doco** (en lugar de *Tiene Implementado DOCO*).
* **Analisis de Procesos con Gcia. Innovacion** (en lugar de *Hizo Análisis de Procesos*).
* **Tienen Firma Digital** (en lugar de *Tiene Firma Digital*).
* **Tienen IA en sus procesos** (en lugar de *Usa Inteligencia Artificial* o *Usa IA*).

---

## ⚙️ Directrices de Desarrollo

1. **Compilación de Producción**: Al modificar archivos de base de datos o APIs en `server.ts`, recordar que para el despliegue en Google Cloud se debe empaquetar el contenedor Docker y la app compilarse usando `npm run build`.
2. **Historial de Cambios**: Cualquier modificación a los datos de un organismo debe guardar un log histórico en la tabla `indicadores_history` conteniendo el snapshot JSON del estado del organismo.
3. **No usar SQLite en producción**: El archivo `sqlite.db` local es puramente de desarrollo o backup. La fuente de verdad online es la base de datos PostgreSQL.
