"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Package, Users, ShoppingCart, Wallet } from "lucide-react";
import PalmDecor from "@/components/PalmDecor";

export default function DashboardHome() {
  const [stats, setStats] = useState({
    productos: 0,
    clientes: 0,
    ventasHoy: 0,
    porCobrar: 0,
  });

  useEffect(() => {
    async function load() {
      const [{ count: productos }, { count: clientes }] = await Promise.all([
        supabase.from("productos").select("*", { count: "exact", head: true }),
        supabase.from("clientes").select("*", { count: "exact", head: true }),
      ]);

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const { data: ventasHoyData } = await supabase
        .from("ventas")
        .select("total")
        .gte("fecha", hoy.toISOString());

      const { data: cxcData } = await supabase
        .from("cuentas_por_cobrar")
        .select("saldo")
        .eq("estado", "pendiente");

      setStats({
        productos: productos || 0,
        clientes: clientes || 0,
        ventasHoy:
          ventasHoyData?.reduce((acc, v) => acc + Number(v.total), 0) || 0,
        porCobrar:
          cxcData?.reduce((acc, c) => acc + Number(c.saldo), 0) || 0,
      });
    }
    load();
  }, []);

  const cards = [
    { label: "Productos", value: stats.productos, icon: Package, color: "bg-ocean-500" },
    { label: "Clientes", value: stats.clientes, icon: Users, color: "bg-palm-500" },
    { label: "Ventas de hoy", value: `$${stats.ventasHoy.toFixed(2)}`, icon: ShoppingCart, color: "bg-sunset-500" },
    { label: "Por cobrar", value: `$${stats.porCobrar.toFixed(2)}`, icon: Wallet, color: "bg-sand-500" },
  ];

  return (
    <div className="relative">
      <PalmDecor className="absolute -right-4 -top-10 w-32 opacity-40 pointer-events-none" />
      <h1 className="text-2xl font-bold text-ocean-800 mb-1">¡Bienvenido! 🌴</h1>
      <p className="text-ocean-500 mb-6">Resumen general de tu negocio</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`${color} text-white rounded-xl p-3`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-sm text-ocean-500">{label}</p>
              <p className="text-xl font-bold text-ocean-900">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
