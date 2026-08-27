import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Faltan variables de entorno de Supabase en el backend');
}

if (!supabaseJwtSecret) {
  console.warn('⚠️  SUPABASE_JWT_SECRET no definido — auth middleware no funcionará');
}

// Cliente Supabase con service_role (MÁS PODEROSO - solo backend)
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// JWT secret para verificar tokens de auth en el middleware
export { supabaseJwtSecret };
