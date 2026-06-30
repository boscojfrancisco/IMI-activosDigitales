# ── Stage 1: Build ──
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias de compilación para better-sqlite3
RUN apk add --no-cache python3 make g++

# Copiar archivos de dependencias
COPY package.json package-lock.json ./

# Instalar todas las dependencias (incluyendo devDependencies para el build)
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Compilar frontend (Vite) + backend (esbuild)
RUN npm run build

# ── Stage 2: Runtime ──
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias de compilación para better-sqlite3 (necesario para native addon)
RUN apk add --no-cache python3 make g++

# Copiar package files e instalar solo dependencias de producción
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copiar el build compilado desde la stage anterior
COPY --from=builder /app/dist ./dist

# Copiar la base de datos SQLite con los datos actuales
COPY sqlite.db ./sqlite.db
COPY tsconfig.json ./tsconfig.json

# Puerto que Cloud Run asigna dinámicamente
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Ejecutar el servidor compilado
CMD ["node", "dist/server.cjs"]
