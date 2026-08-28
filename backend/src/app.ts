import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import productosRoutes from './routes/productos';
import catalogosRoutes from './routes/catalogos';
import ofertasRoutes from './routes/ofertas';
import transaccionesRoutes from './routes/transacciones';
import solicitudesVendedorRoutes from './routes/solicitudesVendedor';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// =============================================
// Rutas
// =============================================

// Ruta de salud
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Servidor R-Drop funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/productos', productosRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/ofertas', ofertasRoutes);
app.use('/api/transacciones', transaccionesRoutes);
app.use('/api/solicitudes-vendedor', solicitudesVendedorRoutes);

// =============================================
// Middleware de 404 (después de todas las rutas)
// =============================================
app.use(notFoundHandler);

// =============================================
// Middleware de errores (último en la cadena)
// =============================================
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor R-Drop backend encendido en: http://localhost:${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
