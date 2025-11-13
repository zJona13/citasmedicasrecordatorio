import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import pacientesRoutes from './routes/pacientes.js';
import profesionalesRoutes from './routes/profesionales.js';
import especialidadesRoutes from './routes/especialidades.js';
import citasRoutes from './routes/citas.js';
import listaEsperaRoutes from './routes/listaEspera.js';
import confirmacionesRoutes from './routes/confirmaciones.js';
import reniecRoutes from './routes/reniec.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/profesionales', profesionalesRoutes);
app.use('/api/especialidades', especialidadesRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/lista-espera', listaEsperaRoutes);
app.use('/api/confirmaciones', confirmacionesRoutes);
app.use('/api/reniec', reniecRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

