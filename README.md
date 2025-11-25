# Sistema de Gestión de Citas Médicas con Recordatorios

Sistema completo de gestión de citas médicas con automatización de recordatorios, chatbot para agendamiento, lista de espera inteligente y notificaciones vía WhatsApp. Desarrollado para centros médicos que necesitan optimizar la gestión de citas y mejorar la comunicación con pacientes.

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Características Principales](#características-principales)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Configuración](#instalación-y-configuración)
- [Base de Datos](#base-de-datos)
- [Funcionalidades Detalladas](#funcionalidades-detalladas)
- [API REST](#api-rest)
- [Automatizaciones y Jobs](#automatizaciones-y-jobs)
- [Frontend](#frontend)
- [Variables de Entorno](#variables-de-entorno)
- [Scripts Disponibles](#scripts-disponibles)
- [Guía de Uso](#guía-de-uso)

---

## 🎯 Descripción General

Este sistema es una solución integral para la gestión de citas médicas que incluye:

- **Gestión completa de citas**: Creación, edición, cancelación y reprogramación
- **Automatización de recordatorios**: Envío automático de recordatorios 48h y 24h antes de las citas
- **Confirmaciones automáticas**: Solicitud de confirmación 3h antes de las citas
- **Chatbot inteligente**: Agendamiento de citas mediante conversación natural
- **Lista de espera**: Sistema automático que notifica a pacientes cuando hay disponibilidad
- **Integración WhatsApp**: Comunicación bidireccional con pacientes
- **Dashboard analítico**: Métricas y reportes en tiempo real
- **Gestión multi-sede**: Soporte para múltiples sedes médicas
- **Integración RENIEC**: Validación automática de datos de pacientes

---

## ✨ Características Principales

### 1. Gestión de Citas
- Agendamiento manual y automático (vía chatbot)
- Validación de disponibilidad en tiempo real
- Soporte para citas excepcionales (fuera del horario normal)
- Estados: pendiente, confirmada, cancelada, completada, no_show
- Reprogramación y cancelación con notificaciones automáticas

### 2. Sistema de Notificaciones Automáticas
- **Recordatorio 48h**: Enviado 2 días antes de la cita
- **Recordatorio 24h**: Enviado 1 día antes de la cita
- **Confirmación 3h**: Solicitud de confirmación 3 horas antes
- Canales: WhatsApp (principal) y SMS (opcional)
- Configuración de canales preferidos (WhatsApp, SMS, o ambos)

### 3. Chatbot de Agendamiento
- Interfaz conversacional para agendar citas
- Selección de especialidad y profesional
- Visualización de disponibilidad en tiempo real
- Integración con lista de espera cuando no hay disponibilidad
- Sesiones con timeout configurable (1 hora por defecto)

### 4. Lista de Espera Inteligente
- Registro automático cuando no hay disponibilidad
- Notificación automática cuando se libera un espacio
- Priorización de adultos mayores (configurable)
- Ofertas con tiempo límite de respuesta
- Respuestas automáticas vía WhatsApp (ACEPTAR/IGNORAR)

### 5. Dashboard y Reportes
- KPIs en tiempo real: citas del día, ocupación, confirmaciones
- Gráficos de tendencias y ocupación
- Reportes por período, profesional, especialidad
- Exportación de datos

### 6. Gestión de Entidades
- **Pacientes**: Registro completo con validación RENIEC
- **Profesionales**: Gestión de médicos con horarios personalizados
- **Especialidades**: Catálogo de especialidades médicas
- **Sedes**: Gestión multi-sede con configuración independiente

### 7. Sistema de Autenticación
- Login seguro con JWT
- Roles: Administrador y Recepcionista
- Protección de rutas y endpoints

---

## 🏗️ Arquitectura del Sistema

El sistema sigue una arquitectura de **aplicación fullstack** con separación clara entre frontend y backend:

```
┌─────────────────┐
│   Frontend      │  React + TypeScript + Vite
│   (React SPA)   │  Tailwind CSS + shadcn/ui
└────────┬────────┘
         │ HTTP/REST API
┌────────▼────────┐
│    Backend      │  Node.js + Express
│   (API REST)    │  MySQL Database
└────────┬────────┘
         │
┌────────▼────────┐
│   Base de       │  MySQL 8+
│   Datos         │
└─────────────────┘
         │
┌────────▼────────┐
│   WhatsApp      │  whatsapp-web.js
│   Integration   │
└─────────────────┘
```

---

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** (v18+): Runtime de JavaScript
- **Express.js** (v5.1.0): Framework web
- **MySQL2** (v3.15.3): Cliente de base de datos
- **JWT** (jsonwebtoken): Autenticación
- **bcrypt**: Hash de contraseñas
- **whatsapp-web.js** (v1.34.2): Integración WhatsApp
- **node-cron** (v3.0.3): Jobs programados
- **express-validator**: Validación de datos
- **express-rate-limit**: Rate limiting

### Frontend
- **React** (v18.3.1): Biblioteca UI
- **TypeScript**: Tipado estático
- **Vite** (v5.4.19): Build tool y dev server
- **React Router** (v6.30.1): Enrutamiento
- **TanStack Query** (v5.83.0): Gestión de estado del servidor
- **Tailwind CSS** (v3.4.17): Estilos
- **shadcn/ui**: Componentes UI
- **Recharts** (v2.15.4): Gráficos
- **React Hook Form** (v7.61.1): Formularios
- **Zod** (v3.25.76): Validación de esquemas

### Base de Datos
- **MySQL 8+** o **MariaDB**: Base de datos relacional

---

## 📁 Estructura del Proyecto

```
citasmedicasrecordatorio/
│
├── backend/                    # API REST (Node.js/Express)
│   ├── src/
│   │   ├── app.js             # Punto de entrada de la aplicación
│   │   ├── auth.js            # Middleware de autenticación
│   │   ├── db.js              # Configuración de conexión a BD
│   │   │
│   │   ├── controllers/       # Controladores de rutas
│   │   │   ├── chatbot.js
│   │   │   ├── citas.js
│   │   │   ├── configuraciones.js
│   │   │   ├── confirmaciones.js
│   │   │   ├── dashboard.js
│   │   │   ├── especialidades.js
│   │   │   ├── listaEspera.js
│   │   │   ├── notificaciones.js
│   │   │   ├── pacientes.js
│   │   │   ├── profesionales.js
│   │   │   ├── reniec.js
│   │   │   ├── reportes.js
│   │   │   └── sedes.js
│   │   │
│   │   ├── routes/            # Definición de rutas
│   │   │   ├── auth.js
│   │   │   ├── chatbot.js
│   │   │   ├── citas.js
│   │   │   ├── configuraciones.js
│   │   │   ├── confirmaciones.js
│   │   │   ├── dashboard.js
│   │   │   ├── especialidades.js
│   │   │   ├── listaEspera.js
│   │   │   ├── notificaciones.js
│   │   │   ├── pacientes.js
│   │   │   ├── profesionales.js
│   │   │   ├── reniec.js
│   │   │   ├── reportes.js
│   │   │   ├── sedes.js
│   │   │   └── webhooks.js
│   │   │
│   │   ├── services/          # Lógica de negocio
│   │   │   ├── chatbot.js          # Lógica del chatbot
│   │   │   ├── configuraciones.js  # Gestión de configuraciones
│   │   │   ├── messaging.js        # Envío de mensajes
│   │   │   ├── notifications.js    # Jobs de notificaciones
│   │   │   ├── reniec.js           # Integración RENIEC
│   │   │   ├── sedes.js            # Gestión de sedes
│   │   │   ├── waitingList.js      # Lista de espera
│   │   │   └── whatsapp.js         # Cliente WhatsApp
│   │   │
│   │   └── utils/             # Utilidades
│   │       ├── availability.js    # Cálculo de disponibilidad
│   │       └── horarios.js        # Validación de horarios
│   │
│   ├── database/              # Scripts SQL
│   │   ├── bd.sql                    # Esquema principal
│   │   ├── migrate_*.sql             # Migraciones
│   │   ├── populate_data.sql        # Datos de prueba
│   │   └── seed_completo_2025.sql   # Seed completo
│   │
│   ├── whatsapp-session/      # Sesión persistente de WhatsApp
│   ├── package.json
│   └── .env.example
│
├── frontend/                  # Aplicación React (SPA)
│   ├── src/
│   │   ├── App.tsx            # Componente principal
│   │   ├── main.tsx           # Punto de entrada
│   │   │
│   │   ├── pages/             # Páginas de la aplicación
│   │   │   ├── Auth.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Citas.tsx
│   │   │   ├── Pacientes.tsx
│   │   │   ├── Profesionales.tsx
│   │   │   ├── Especialidades.tsx
│   │   │   ├── ListaEspera.tsx
│   │   │   ├── Confirmaciones.tsx
│   │   │   ├── Reportes.tsx
│   │   │   ├── Automatizaciones.tsx
│   │   │   ├── Configuracion.tsx
│   │   │   ├── Chatbot.tsx
│   │   │   └── NotFound.tsx
│   │   │
│   │   ├── components/        # Componentes reutilizables
│   │   │   ├── layout/        # Layout (Sidebar, TopBar)
│   │   │   ├── citas/         # Componentes de citas
│   │   │   ├── dashboard/     # Componentes del dashboard
│   │   │   ├── chatbot/       # Componentes del chatbot
│   │   │   └── ui/            # Componentes UI (shadcn)
│   │   │
│   │   ├── contexts/          # Contextos React
│   │   │   └── AuthContext.tsx
│   │   │
│   │   ├── hooks/             # Custom hooks
│   │   │   ├── use-debounce.ts
│   │   │   ├── use-mobile.tsx
│   │   │   └── use-toast.ts
│   │   │
│   │   └── lib/               # Utilidades
│   │       ├── api.ts         # Cliente API
│   │       └── utils.ts       # Funciones auxiliares
│   │
│   ├── public/                # Archivos estáticos
│   ├── package.json
│   └── .env.example
│
└── README.md                  # Este archivo
```

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 18 o superior (recomendado usar [nvm-windows](https://github.com/coreybutler/nvm-windows) en Windows)
- **MySQL** 8.0 o superior (o MariaDB 10.3+)
- **Git** para clonar el repositorio
- **Navegador moderno** (Chrome, Firefox, Edge, Safari)

---

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

   ```bash
   git clone <URL_DEL_REPO>
   cd citasmedicasrecordatorio
   ```

### 2. Configurar el Backend

   ```bash
   cd backend
   npm install
```

Crear archivo `.env` basado en `.env.example`:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=tu_contraseña_mysql
DB_NAME=citas_medicas
JWT_SECRET=tu_secreto_jwt_super_seguro
PUBLIC_URL=http://localhost:3000
PUBLIC_URL_FRONT=http://localhost:5173
WHATSAPP_SESSION_PATH=./whatsapp-session
CHATBOT_SESSION_TIMEOUT=3600000
WHATSAPP_DEMO_MODE=false
```

### 3. Configurar la Base de Datos

1. Crear la base de datos en MySQL:
```sql
CREATE DATABASE citas_medicas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Ejecutar el script de creación:
```bash
mysql -u root -p citas_medicas < backend/database/bd.sql
```

3. (Opcional) Ejecutar migraciones adicionales:
```bash
mysql -u root -p citas_medicas < backend/database/migrate_configuraciones.sql
mysql -u root -p citas_medicas < backend/database/migrate_sedes.sql
mysql -u root -p citas_medicas < backend/database/migrate_lista_espera.sql
mysql -u root -p citas_medicas < backend/database/migrate_index_confirmaciones.sql
```

4. (Opcional) Poblar con datos de prueba:
```bash
mysql -u root -p citas_medicas < backend/database/populate_data.sql
```

### 4. Configurar el Frontend

   ```bash
   cd frontend
   npm install
```

Crear archivo `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

### 5. Iniciar los Servidores

**Terminal 1 - Backend:**
```bash
cd backend
npm run server
```

**Terminal 2 - Frontend:**
```bash
cd frontend
   npm run dev
   ```

### 6. Autenticación de WhatsApp

Al iniciar el backend por primera vez, se generará un código QR en la consola. Debes:

1. Abrir WhatsApp en tu teléfono
2. Ir a Configuración > Dispositivos vinculados
3. Escanear el código QR mostrado en la consola
4. Esperar a que aparezca el mensaje: `✅ Cliente de WhatsApp está listo!`

La sesión se guardará en `backend/whatsapp-session/` y no necesitarás escanear el QR nuevamente.

---

## 🗄️ Base de Datos

### Esquema Principal

El sistema utiliza las siguientes tablas principales:

#### `usuarios`
- Gestión de usuarios del sistema (admin, recepcionista)
- Autenticación con JWT y bcrypt

#### `especialidades`
- Catálogo de especialidades médicas
- Estado activo/inactivo

#### `profesionales`
- Información de médicos/profesionales
- Horarios personalizados (JSON)
- Relación con especialidades
- CMP (Colegio Médico del Perú)

#### `pacientes`
- Registro completo de pacientes
- DNI único, teléfono, email
- Integración con RENIEC

#### `citas`
- Gestión de citas médicas
- Estados: pendiente, confirmada, cancelada, completada, no_show
- Soporte para citas excepcionales (fuera de horario)

#### `confirmaciones`
- Historial de recordatorios y confirmaciones enviados
- Estado de entrega y respuesta del paciente
- Canal utilizado (WhatsApp/SMS)

#### `lista_espera`
- Pacientes en espera de disponibilidad
- Ofertas activas con tiempo límite
- Priorización automática

#### `configuraciones`
- Configuraciones del sistema
- Habilitación/deshabilitación de funcionalidades
- Mensajes personalizables

#### `sedes`
- Gestión de múltiples sedes médicas
- Configuración independiente por sede

### Migraciones

El sistema incluye migraciones para:
- Tabla de configuraciones
- Tabla de sedes
- Tabla de lista de espera
- Índices optimizados para confirmaciones

---

## 🔧 Funcionalidades Detalladas

### 1. Gestión de Citas

#### Crear Cita
- Validación de disponibilidad en tiempo real
- Verificación de horarios del profesional
- Soporte para citas excepcionales (con razón)
- Creación automática de paciente si no existe

#### Estados de Cita
- **pendiente**: Cita creada, esperando confirmación
- **confirmada**: Paciente confirmó la cita
- **cancelada**: Cita cancelada (libera espacio para lista de espera)
- **completada**: Cita realizada exitosamente
- **no_show**: Paciente no asistió

#### Validaciones
- No permite doble reserva en mismo horario
- Valida horarios del profesional
- Verifica disponibilidad antes de crear

### 2. Sistema de Notificaciones

#### Recordatorios 48h
- Se ejecuta cada hora
- Envía recordatorio 2 días antes de la cita
- Configurable (habilitar/deshabilitar)

#### Recordatorios 24h
- Se ejecuta cada hora
- Envía recordatorio 1 día antes de la cita
- Incluye detalles de la cita

#### Confirmaciones 3h
- Se ejecuta cada 15 minutos
- Solicita confirmación 3 horas antes
- Paciente puede responder CONFIRMAR o CANCELAR vía WhatsApp

#### Canales de Comunicación
- **WhatsApp**: Canal principal (requiere autenticación)
- **SMS**: Opcional (actualmente usa WhatsApp)
- **Ambos**: Envío por ambos canales

### 3. Chatbot de Agendamiento

#### Flujo Conversacional
1. **Inicio**: Saludo y opción de agendar
2. **Especialidad**: Selección de especialidad médica
3. **Profesional**: Selección de médico
4. **Disponibilidad**: Visualización de horarios disponibles
5. **Confirmación**: Confirmación de fecha y hora
6. **Datos**: Solicitud de DNI, nombre y teléfono
7. **Finalización**: Confirmación de cita creada

#### Características
- Sesiones con timeout (1 hora por defecto)
- Integración con lista de espera cuando no hay disponibilidad
- Validación de disponibilidad en tiempo real
- Mensajes personalizables desde configuraciones

#### Acceso
- Ruta pública: `/chatbot`
- No requiere autenticación
- Interfaz conversacional con botones

### 4. Lista de Espera

#### Funcionamiento
- Se activa automáticamente cuando no hay disponibilidad
- Registro manual también disponible
- Notificación automática cuando se libera un espacio

#### Ofertas Automáticas
- Cuando se cancela una cita, se notifica al siguiente en lista
- Oferta con tiempo límite (configurable)
- Paciente responde ACEPTAR o IGNORAR vía WhatsApp
- Si acepta, se crea la cita automáticamente

#### Priorización
- Opción de priorizar adultos mayores (configurable)
- Orden por fecha de registro

### 5. Dashboard

#### KPIs
- Citas del día
- Tasa de ocupación
- Confirmaciones pendientes
- Citas completadas

#### Gráficos
- Tendencia de citas
- Ocupación por día
- Estado de citas

### 6. Integración RENIEC

- Validación automática de DNI
- Obtención de datos del paciente
- Prellenado de formularios

---

## 🌐 API REST

### Autenticación

#### `POST /api/auth/login`
Iniciar sesión
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
}
```

#### `POST /api/auth/register`
Registrar nuevo usuario (solo admin)

### Citas

#### `GET /api/citas`
Obtener todas las citas (con filtros)

#### `POST /api/citas`
Crear nueva cita

#### `GET /api/citas/:id`
Obtener cita por ID

#### `PUT /api/citas/:id`
Actualizar cita

#### `DELETE /api/citas/:id`
Cancelar cita

#### `POST /api/citas/:id/reprogramar`
Reprogramar cita

### Pacientes

#### `GET /api/pacientes`
Listar pacientes

#### `POST /api/pacientes`
Crear paciente

#### `GET /api/pacientes/:id`
Obtener paciente

#### `PUT /api/pacientes/:id`
Actualizar paciente

### Profesionales

#### `GET /api/profesionales`
Listar profesionales

#### `POST /api/profesionales`
Crear profesional

#### `PUT /api/profesionales/:id`
Actualizar profesional

### Especialidades

#### `GET /api/especialidades`
Listar especialidades

#### `POST /api/especialidades`
Crear especialidad

### Lista de Espera

#### `GET /api/lista-espera`
Listar pacientes en espera

#### `POST /api/lista-espera`
Agregar a lista de espera

#### `PUT /api/lista-espera/:id`
Actualizar entrada

### Confirmaciones

#### `GET /api/confirmaciones`
Historial de confirmaciones

#### `POST /api/confirmaciones/enviar`
Enviar confirmación manual

### Chatbot

#### `POST /api/chatbot/message`
Procesar mensaje del chatbot

#### `GET /api/chatbot/session/:sessionId`
Obtener estado de sesión

### Dashboard

#### `GET /api/dashboard/stats`
Estadísticas del dashboard

#### `GET /api/dashboard/ocupacion`
Datos de ocupación

### Reportes

#### `GET /api/reportes/citas`
Reporte de citas

#### `GET /api/reportes/profesionales`
Reporte por profesional

### Configuraciones

#### `GET /api/configuraciones`
Obtener todas las configuraciones

#### `PUT /api/configuraciones/:key`
Actualizar configuración

### RENIEC

#### `POST /api/reniec/consultar`
Consultar DNI en RENIEC

### Notificaciones

#### `GET /api/notificaciones`
Listar notificaciones

#### `POST /api/notificaciones/enviar`
Enviar notificación manual

### Sedes

#### `GET /api/sedes`
Listar sedes

#### `POST /api/sedes`
Crear sede

---

## ⚙️ Automatizaciones y Jobs

El sistema utiliza **node-cron** para ejecutar tareas programadas:

### Job de Recordatorios 48h
- **Frecuencia**: Cada hora (`0 * * * *`)
- **Función**: Envía recordatorios 2 días antes de las citas
- **Configuración**: `reminder_48h_enabled`

### Job de Recordatorios 24h
- **Frecuencia**: Cada hora (`0 * * * *`)
- **Función**: Envía recordatorios 1 día antes de las citas
- **Configuración**: `reminder_24h_enabled`

### Job de Confirmaciones 3h
- **Frecuencia**: Cada 15 minutos (`*/15 * * * *`)
- **Función**: Solicita confirmación 3 horas antes de las citas
- **Ventana**: Entre 3:00 y 3:15 horas antes

### Job de Limpieza de Ofertas
- **Frecuencia**: Cada 5 minutos (`*/5 * * * *`)
- **Función**: Limpia ofertas expiradas de lista de espera

### Notificación de Lista de Espera
- **Trigger**: Cuando se cancela una cita
- **Función**: Notifica automáticamente al siguiente en lista
- **Configuración**: `auto_offer_enabled`

---

## 🎨 Frontend

### Páginas Principales

#### Dashboard (`/`)
- Vista general del sistema
- KPIs y gráficos
- Citas del día

#### Citas (`/citas`)
- Calendario de citas (vista día/semana)
- Crear nueva cita
- Editar/Reprogramar/Cancelar citas
- Filtros por fecha, profesional, estado

#### Pacientes (`/pacientes`)
- Lista de pacientes
- Crear/Editar paciente
- Búsqueda por DNI, nombre
- Validación RENIEC

#### Profesionales (`/profesionales`)
- Lista de profesionales
- Gestión de horarios
- Asignación de especialidades

#### Especialidades (`/especialidades`)
- Catálogo de especialidades
- Activar/Desactivar

#### Lista de Espera (`/lista-espera`)
- Ver pacientes en espera
- Gestionar ofertas
- Historial

#### Confirmaciones (`/confirmaciones`)
- Historial de confirmaciones enviadas
- Estado de respuestas
- Reenvío manual

#### Reportes (`/reportes`)
- Reportes por período
- Exportación de datos
- Gráficos y estadísticas

#### Automatizaciones (`/automatizaciones`)
- Configuración de jobs
- Habilitar/Deshabilitar notificaciones

#### Configuración (`/configuracion`)
- Configuraciones generales
- Mensajes personalizables
- Canales de comunicación

#### Chatbot (`/chatbot`)
- Interfaz pública del chatbot
- Agendamiento conversacional

### Componentes Principales

- **AppSidebar**: Navegación lateral
- **TopBar**: Barra superior con usuario
- **AppointmentCalendar**: Calendario de citas
- **ChatInterface**: Interfaz del chatbot
- **KPICard**: Tarjetas de métricas
- **OccupationChart**: Gráfico de ocupación

---

## 🔐 Variables de Entorno

### Backend (`.env`)

```env
# Servidor
PORT=3000

# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASS=tu_contraseña
DB_NAME=citas_medicas

# Autenticación
JWT_SECRET=tu_secreto_jwt_super_seguro

# URLs
PUBLIC_URL=http://localhost:3000
PUBLIC_URL_FRONT=http://localhost:5173

# WhatsApp
WHATSAPP_SESSION_PATH=./whatsapp-session
WHATSAPP_DEMO_MODE=false

# Chatbot
CHATBOT_SESSION_TIMEOUT=3600000
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3000/api
```

---

## 📜 Scripts Disponibles

### Backend

```bash
npm run server    # Inicia servidor en modo desarrollo (nodemon)
npm start         # Inicia servidor en modo producción
```

### Frontend

```bash
npm run dev       # Servidor de desarrollo (Vite)
npm run build     # Compilar para producción
npm run preview   # Previsualizar build de producción
npm run lint      # Ejecutar linter
```

---

## 📖 Guía de Uso

### Primer Uso

1. **Configurar Base de Datos**
   - Ejecutar scripts SQL en orden
   - Crear usuario administrador manualmente o usar seed

2. **Autenticación WhatsApp**
   - Iniciar backend
   - Escanear QR en consola
   - Esperar confirmación

3. **Acceder al Sistema**
   - Abrir `http://localhost:5173`
   - Iniciar sesión con credenciales de admin
   - Configurar especialidades y profesionales

### Configuración Inicial

1. **Crear Especialidades**
   - Ir a Especialidades
   - Agregar especialidades médicas

2. **Registrar Profesionales**
   - Ir a Profesionales
   - Crear profesionales con horarios
   - Asignar especialidad

3. **Configurar Notificaciones**
   - Ir a Configuración
   - Habilitar recordatorios
   - Seleccionar canal preferido
   - Personalizar mensajes

### Uso Diario

1. **Agendar Citas**
   - Manual: Ir a Citas > Nueva Cita
   - Automático: Paciente usa chatbot en `/chatbot`

2. **Gestionar Confirmaciones**
   - Ver respuestas en Confirmaciones
   - Reenviar si es necesario

3. **Monitorear Dashboard**
   - Ver KPIs en tiempo real
   - Revisar ocupación

4. **Gestionar Lista de Espera**
   - Ver pacientes en espera
   - Gestionar ofertas automáticas

### Personalización

- **Mensajes**: Editar en Configuración > Mensajes
- **Horarios**: Configurar en Profesionales > Horarios
- **Canales**: Seleccionar en Configuración > Canales

---

## 🔒 Seguridad

- Autenticación JWT
- Contraseñas hasheadas con bcrypt
- Rate limiting en endpoints
- Validación de datos con express-validator
- Protección CORS configurada
- Variables de entorno para secretos

---

## 🐛 Solución de Problemas

### WhatsApp no se conecta
- Verificar que el QR se escaneó correctamente
- Eliminar carpeta `whatsapp-session` y reiniciar
- Verificar permisos de escritura

### Base de datos no conecta
- Verificar credenciales en `.env`
- Verificar que MySQL está corriendo
- Verificar que la base de datos existe

### Frontend no carga
- Verificar que el backend está corriendo
- Verificar `VITE_API_URL` en `.env`
- Revisar consola del navegador

### Jobs no se ejecutan
- Verificar que el backend está corriendo
- Revisar logs en consola
- Verificar configuraciones en BD

---

## 📝 Notas Adicionales

- El sistema está diseñado para uso en Perú (código de país 51)
- La integración RENIEC requiere credenciales oficiales
- WhatsApp Web.js puede requerir actualizaciones periódicas
- Se recomienda hacer backups regulares de la base de datos