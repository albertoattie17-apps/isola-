"use client";

import { useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/productos", label: "Productos", icon: Package },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/dashboard/inventario", label: "Inventario", icon: Boxes },
  { href: "/dashboard/cuentas-por-cobrar", label: "Cuentas por Cobrar", icon: Wallet },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false); // desktop: solo íconos
  const [mobileOpen, setMobileOpen] = useState(false); // mobile: menú abierto/cerrado

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function NavContent({ isCollapsed }) {
    return (
      <>
        <div
          className={`flex items-center gap-2 px-5 py-6 border-b border-ocean-600 ${
            isCollapsed ? "justify-center px-0" : ""
          }`}
        >
          <Palmtree className="text-sand-200 shrink-0" size={28} />
          {!isCollapsed && (
            <span className="font-bold text-lg tracking-wide whitespace-nowrap">
              Isola App
            </span>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                title={isCollapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${
                  isCollapsed ? "justify-center px-0" : ""
                } ${
                  active
                    ? "bg-sand-200 text-ocean-900 font-semibold"
                    : "text-ocean-50 hover:bg-ocean-600"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          title={isCollapsed ? "Cerrar sesión" : undefined}
          className={`flex items-center gap-2 m-3 px-3 py-2 rounded-xl text-sm bg-ocean-800 hover:bg-ocean-900 transition ${
            isCollapsed ? "justify-center px-0" : ""
          }`}
        >
          <LogOut size={16} className="shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Cerrar sesión</span>}
        </button>
      </>
    );
  }

  return (
    <>
      {/* Barra superior solo en celular */}
      <div className="md:hidden flex items-center justify-between bg-ocean-700 text-white px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Palmtree className="text-sand-200" size={22} />
          <span className="font-bold">Isola App</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-1">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar desktop */}
      <aside
        className={`hidden md:flex ${
          collapsed ? "w-16" : "w-64"
        } min-h-screen bg-ocean-700 text-white flex-col shrink-0 transition-all duration-200 relative`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expandir menú" : "Ocultar menú"}
          className="absolute -right-3 top-8 bg-sand-200 text-ocean-800 rounded-full p-1 shadow-md hover:bg-sand-300 z-10"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <NavContent isCollapsed={collapsed} />
      </aside>

      {/* Overlay + menú deslizable en celular */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-ocean-900/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-ocean-700 text-white flex flex-col min-h-screen">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 text-ocean-100"
            >
              <X size={22} />
            </button>
            <NavContent isCollapsed={false} />
          </aside>
        </div>
      )}
    </>
  );
}
