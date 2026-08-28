# 🌴 Tienda Playa — Sistema de Gestión

App para manejar **productos, clientes, ventas, inventario y cuentas por cobrar**, con login y tema de playa. Hecha con **Next.js + Supabase**, lista para desplegar en **Vercel**.

---

## 1. Crear el proyecto en Supabase

1. Ve a https://supabase.com y crea una cuenta (gratis).
2. Clic en **"New project"**. Elige nombre, contraseña de base de datos y región (elige una cercana, ej. `us-east-1`).
3. Espera 1-2 minutos a que se cree el proyecto.
4. En el menú lateral ve a **Project Settings > API**. Copia:
   - **Project URL** → lo pegarás en `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → lo pegarás en `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Crear las tablas

1. En el menú lateral de Supabase, ve a **SQL Editor > New query**.
2. Abre el archivo `supabase-schema.sql` (incluido en este proyecto), copia todo su contenido y pégalo ahí.
3. Dale a **Run**. Esto crea todas las tablas (productos, clientes, ventas, venta_items, movimientos_inventario, cuentas_por_cobrar, pagos) y la seguridad (RLS).

## 3. Crear usuarios (login con correo y contraseña)

1. Ve a **Authentication > Users** en Supabase.
2. Clic en **"Add user" > "Create new user"**.
3. Ingresa el correo y contraseña de cada persona que usará el sistema (todos tienen el mismo rol/acceso).
4. Ve a **Authentication > Providers** y confirma que **Email** esté habilitado. Si quieres evitar el paso de confirmación por correo, en **Authentication > Settings** desactiva "Confirm email" (útil si tú mismo creas los usuarios manualmente).

## 4. Configurar el proyecto localmente

```bash
# Instala dependencias
npm install

# Copia el archivo de variables de entorno
cp .env.local.example .env.local
```

Edita `.env.local` y pega tu URL y anon key de Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

Corre el proyecto localmente:

```bash
npm run dev
```

Abre http://localhost:3000 — deberías ver la pantalla de login. Ingresa con el usuario que creaste en el paso 3.

## 5. Desplegar en Vercel

1. Sube este proyecto a un repositorio de GitHub (o GitLab/Bitbucket).
2. Ve a https://vercel.com, inicia sesión con tu cuenta de GitHub.
3. Clic en **"Add New... > Project"** y selecciona tu repositorio.
4. En **Environment Variables**, agrega las mismas dos variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Clic en **Deploy**. En 1-2 minutos tendrás tu app en una URL como `tu-app.vercel.app`.

## Módulos incluidos

- **Login** — autenticación con correo/contraseña vía Supabase Auth.
- **Productos** — catálogo con precio, costo, stock y stock mínimo.
- **Clientes** — directorio de clientes.
- **Ventas** — registra ventas (contado o crédito), descuenta stock automáticamente y crea la cuenta por cobrar si aplica.
- **Inventario** — ver stock actual y registrar entradas/salidas manuales, con historial de movimientos.
- **Cuentas por Cobrar** — ver saldos pendientes/vencidos y registrar abonos de clientes.

## Notas

- Todos los usuarios tienen el mismo nivel de acceso (no hay roles diferenciados).
- Para agregar o quitar usuarios, hazlo desde **Authentication > Users** en Supabase — no hace falta tocar el código.
- El tema visual usa colores de océano, arena y palmera, con acentos de atardecer.
