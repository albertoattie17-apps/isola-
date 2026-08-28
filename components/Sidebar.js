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
  { href: "/dashboard/inventario", label: "Inventario", icon: Boxes },
  { href: "/dashboard/cuentas-por-cobrar", label: "Cuentas por Cobrar", icon: Wallet },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="w-64 min-h-screen bg-ocean-700 text-white flex flex-col shrink-0">
      <div className="flex items-center gap-2 px-5 py-6 border-b border-ocean-600">
        <Palmtree className="text-sand-200" size={28} />
        <span className="font-bold text-lg tracking-wide">Isola App</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${
                active
                  ? "bg-sand-200 text-ocean-900 font-semibold"
                  : "text-ocean-50 hover:bg-ocean-600"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 m-3 px-3 py-2 rounded-xl text-sm bg-ocean-800 hover:bg-ocean-900 transition"
      >
        <LogOut size={16} /> Cerrar sesión
      </button>
    </aside>
  );
}
