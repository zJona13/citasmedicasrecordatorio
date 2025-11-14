# Citas Médicas - Recordatorio

Aplicación fullstack para gestionar citaass médicas y recordatorios a pacientes.

## Estructura del proyecto

```
backend/    API REST con Express y MySQL
frontend/   SPA en React + Vite + Tailwind (TypeScript)
```

Ambos paquetes usan Node.js ≥ 18. Cada carpeta contiene su propio `package.json`.

## Requisitos previos

- Node.js 18 o superior (recomendado instalar con [nvm-windows](https://github.com/coreybutler/nvm-windows))
- MySQL 8 (o compatible)
- Git

## Configuración inicial

1. **Clonar el repositorio**

   ```bash
   git clone <URL_DEL_REPO>
   cd citasmedicasrecordatorio
   ```

2. **Backend**

   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run dev
   ```

3. **Frontend**

   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```

4. Abrir el frontend en `http://localhost:5173` (por defecto Vite) y la API en `http://localhost:3000`.

## Variables de entorno

### Backend (`backend/.env`)

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=citasmédicas
JWT_SECRET=supersecreto
PUBLIC_URL=http://localhost:3000
PUBLIC_URL_FRONT=http://localhost:5173

# Twilio Configuration (para SMS/WhatsApp)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
TWILIO_DEMO_MODE=true
CHATBOT_SESSION_TIMEOUT=3600000
```

- `PUBLIC_URL` se usa para generar enlaces públicos de la receta
- `PUBLIC_URL_FRONT` se usa para redirigir a la vista pública del frontend
- `WHATSAPP_SESSION_PATH` permite persistir la sesión de `whatsapp-web.js`
- `TOKEN_API_DOCUMENT_MYDEVS` y `KEY_API_DOCUMENT_MYDEVS` se requieren para consultar la información del DNI en RENIEC mediante el servicio de MyDevs.
- `TWILIO_*` variables para configuración de Twilio (SMS/WhatsApp). `TWILIO_DEMO_MODE=true` evita consumir crédito durante desarrollo.
- `CHATBOT_SESSION_TIMEOUT` tiempo de expiración de sesión del chatbot en milisegundos (default: 1 hora)

### Frontend (`frontend/.env`)

```
VITE_API_URL=http://localhost:3000/api
```

## Base de datos

El archivo `backend/database/bd.sql` contiene un esquema inicial. Ejecuta el script en tu instancia de MySQL antes de iniciar la API.

## Scripts disponibles

| Ruta       | Comando        | Descripción                     |
| ---------- | -------------- | -------------------------------- |
| `backend`  | `npm run server`  | Ejecuta la API con recarga      |
|            | `npm start`    | Ejecuta la API en modo producción |
| `frontend` | `npm run dev`  | Servidor de desarrollo Vite     |
|            | `npm run build`| Compila la SPA para producción  |

## Preparar para subir a GitHub

- Revisa que `node_modules/` no esté versionado (se ignora mediante `.gitignore`)
- Completa los archivos `.env` con tus credenciales locales antes de ejecutar
- Ejecuta `npm run build` en el frontend y pruebas manuales en la API según lo requieras
- Haz commit de tus cambios y `git push` al repositorio remoto

¡Listo! Tu proyecto quedará organizado para desplegarse o continuar el desarrollo.