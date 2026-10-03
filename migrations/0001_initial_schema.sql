-- Cloudflare D1 Initial Database Schema for Maquinaria Renteria / Tortilleria Renteria
-- Run with: npx wrangler d1 execute tortilleria-renteria-db --file=./migrations/0001_initial_schema.sql

-- 1. Tabla de Cotizaciones de Clientes
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  city TEXT,
  state TEXT,
  machine_id TEXT,
  machine_name TEXT,
  message TEXT,
  status TEXT DEFAULT 'Pendiente',
  total_mxn REAL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- 2. Tabla de Ventas y Órdenes de Compra
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  items_json TEXT NOT NULL,
  total_mxn REAL NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  stripe_session_id TEXT,
  created_at TEXT NOT NULL
);

-- 3. Tabla de Citas para Demostración en Planta (Delicias, Chihuahua)
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT DEFAULT 'Confirmada',
  created_at TEXT NOT NULL
);

-- 4. Tabla de Catálogo de Maquinaria
CREATE TABLE IF NOT EXISTS machines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT,
  price_mxn REAL NOT NULL,
  price_usd REAL,
  image_url TEXT,
  updated_at TEXT NOT NULL
);

-- 5. Tabla de Configuración Oficial de la Empresa
CREATE TABLE IF NOT EXISTS site_config (
  id TEXT PRIMARY KEY,
  business_name TEXT,
  slogan TEXT,
  phone1 TEXT,
  phone2 TEXT,
  email TEXT,
  address TEXT,
  stripe_payment_link TEXT,
  updated_at TEXT NOT NULL
);

-- 6. Tabla de Visitas y Telemetría Temporal (Purgable con botón Liberar Espacio)
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  page TEXT,
  ip_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla de Auditoría de Seguridad
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  timestamp TEXT NOT NULL
);
