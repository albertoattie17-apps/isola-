"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Boxes,
  Wallet,
  LogOut,
  Palmtree,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/productos", label: "Productos", icon: Package },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/dashboard/cuentas-por-cobrar", label: "Por Cobrar", icon: Wallet },
  { href: "/dashboard/inventario", label: "Inventario", icon: Boxes },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 bg-ocean-700 text-white shadow-lg shadow-ocean-900/20">
      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 h-14">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <Palmtree className="text-sand-200" size={26} />
          <span className="hidden sm:inline font-bold text-lg tracking-wide whitespace-nowrap">
            Isola App
          </span>
        </Link>

        {/* Menú en una sola línea (con scroll horizontal si no cabe) */}
        <nav className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar justify-start md:justify-center">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition shrink-0 ${
                  active
                    ? "bg-sand-200 text-ocean-900 font-semibold"
                    : "text-ocean-50 hover:bg-ocean-600"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Cerrar sesión */}
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-ocean-800 hover:bg-ocean-900 transition shrink-0"
        >
          <LogOut size={16} />
          <span className="hidden md:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
