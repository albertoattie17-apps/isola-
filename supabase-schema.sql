-- ============================================================
-- ESQUEMA DE BASE DE DATOS - Sistema de Ventas e Inventario
-- Ejecuta este script completo en Supabase: SQL Editor > New query
-- ============================================================

-- CLIENTES
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  email text,
  direccion text,
  created_at timestamptz default now()
);

-- PRODUCTOS
create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  categoria text,
  precio numeric(12,2) not null default 0,
  costo numeric(12,2) default 0,
  stock integer not null default 0,
  stock_minimo integer default 5,
  activo boolean default true,
  created_at timestamptz default now()
);

-- VENTAS
create table if not exists ventas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id),
  fecha timestamptz default now(),
  total numeric(12,2) not null default 0,
  tipo_pago text not null default 'contado', -- contado | credito
  estado text not null default 'completada', -- completada | anulada
  usuario_email text,
  created_at timestamptz default now()
);

-- DETALLE DE VENTA
create table if not exists venta_items (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid references ventas(id) on delete cascade,
  producto_id uuid references productos(id),
  cantidad integer not null,
  precio_unitario numeric(12,2) not null,
  subtotal numeric(12,2) not null
);

-- MOVIMIENTOS DE INVENTARIO (historial de entradas/salidas)
create table if not exists movimientos_inventario (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid references productos(id),
  tipo text not null, -- entrada | salida | ajuste
  cantidad integer not null,
  motivo text,
  usuario_email text,
  fecha timestamptz default now()
);

-- CUENTAS POR COBRAR
create table if not exists cuentas_por_cobrar (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid references ventas(id),
  cliente_id uuid references clientes(id),
  monto_total numeric(12,2) not null,
  monto_pagado numeric(12,2) not null default 0,
  saldo numeric(12,2) not null,
  fecha_vencimiento date,
  estado text not null default 'pendiente', -- pendiente | pagada | vencida
  created_at timestamptz default now()
);

-- PAGOS (abonos a cuentas por cobrar)
create table if not exists pagos (
  id uuid primary key default gen_random_uuid(),
  cuenta_id uuid references cuentas_por_cobrar(id) on delete cascade,
  monto numeric(12,2) not null,
  metodo_pago text default 'efectivo',
  usuario_email text,
  fecha timestamptz default now()
);

-- ============================================================
-- SEGURIDAD (RLS) - cualquier usuario autenticado puede usar el sistema
-- ============================================================
alter table clientes enable row level security;
alter table productos enable row level security;
alter table ventas enable row level security;
alter table venta_items enable row level security;
alter table movimientos_inventario enable row level security;
alter table cuentas_por_cobrar enable row level security;
alter table pagos enable row level security;

create policy "auth_all_clientes" on clientes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all_productos" on productos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all_ventas" on ventas for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all_venta_items" on venta_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all_movimientos" on movimientos_inventario for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all_cxc" on cuentas_por_cobrar for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all_pagos" on pagos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Índices útiles
create index if not exists idx_venta_items_venta on venta_items(venta_id);
create index if not exists idx_movimientos_producto on movimientos_inventario(producto_id);
create index if not exists idx_cxc_cliente on cuentas_por_cobrar(cliente_id);
create index if not exists idx_pagos_cuenta on pagos(cuenta_id);
