import "./globals.css";

export const metadata = {
  title: "Isola App | Gestión de Negocio",
  description: "Productos, clientes, ventas, inventario y cuentas por cobrar",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
