-- Agrega el color a cada producto.
-- Ejecuta esto en Supabase: SQL Editor > New query > Run
alter table productos add column if not exists color text;
