"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, DollarSign } from "lucide-react";

export default function CuentasPorCobrarPage() {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [cuentaActiva, setCuentaActiva] = useState(null);
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("efectivo");
  const [filtro, setFiltro] = useState("pendiente");

  async function loadCuentas() {
    setLoading(true);
    let query = supabase
      .from("cuentas_por_cobrar")
      .select("*, clientes(nombre)")
      .order("fecha_vencimiento", { ascending: true });
    if (filtro !== "todas") query = query.eq("estado", filtro);
    const { data } = await query;
    setCuentas(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadCuentas();
  }, [filtro]);

  function openPago(cuenta) {
    setCuentaActiva(cuenta);
    setMonto("");
    setMetodo("efectivo");
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const abono = Number(monto);
    if (abono <= 0 || abono > cuentaActiva.saldo) {
      alert("Ingresa un monto válido (no puede exceder el saldo).");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("pagos").insert({
      cuenta_id: cuentaActiva.id,
      monto: abono,
      metodo_pago: metodo,
      usuario_email: user?.email,
    });

    const nuevoPagado = Number(cuentaActiva.monto_pagado) + abono;
    const nuevoSaldo = Number(cuentaActiva.monto_total) - nuevoPagado;

    await supabase
      .from("cuentas_por_cobrar")
      .update({
        monto_pagado: nuevoPagado,
        saldo: nuevoSaldo,
        estado: nuevoSaldo <= 0 ? "pagada" : "pendiente",
      })
      .eq("id", cuentaActiva.id);

    setShowForm(false);
    loadCuentas();
  }

  function estaVencida(cuenta) {
    if (!cuenta.fecha_vencimiento || cuenta.estado === "pagada") return false;
    return new Date(cuenta.fecha_vencimiento) < new Date();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ocean-800">Cuentas por Cobrar</h1>
          <p className="text-ocean-500">Ventas a crédito y abonos de clientes</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {["pendiente", "pagada", "todas"].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize ${filtro === f ? "bg-ocean-600 text-white" : "bg-white text-ocean-600"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="beach-table w-full">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Total</th>
              <th>Pagado</th>
              <th>Saldo</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="text-center py-6 text-ocean-400">Cargando...</td></tr>}
            {!loading && cuentas.length === 0 && (
              <tr><td colSpan={7} className="text-center py-6 text-ocean-400">No hay cuentas registradas.</td></tr>
            )}
            {cuentas.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.clientes?.nombre || "-"}</td>
                <td>${Number(c.monto_total).toFixed(2)}</td>
                <td>${Number(c.monto_pagado).toFixed(2)}</td>
                <td className="font-semibold">${Number(c.saldo).toFixed(2)}</td>
                <td>{c.fecha_vencimiento || "-"}</td>
                <td>
                  {c.estado === "pagada" ? (
                    <span className="text-palm-600 font-medium">Pagada</span>
                  ) : estaVencida(c) ? (
                    <span className="text-sunset-600 font-medium">Vencida</span>
                  ) : (
                    <span className="text-sand-600 font-medium">Pendiente</span>
                  )}
                </td>
                <td>
                  {c.estado !== "pagada" && (
                    <button onClick={() => openPago(c)} className="text-ocean-600 hover:text-ocean-800 flex items-center gap-1 text-sm">
                      <DollarSign size={14} /> Abonar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && cuentaActiva && (
        <div className="fixed inset-0 bg-ocean-900/40 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleSubmit} className="card w-full max-w-sm p-6 relative">
            <button type="button" onClick={() => setShowForm(false)} className="absolute right-4 top-4 text-ocean-400">
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold text-ocean-800 mb-1">Registrar abono</h2>
            <p className="text-sm text-ocean-500 mb-4">
              Cliente: {cuentaActiva.clientes?.nombre} — Saldo: ${Number(cuentaActiva.saldo).toFixed(2)}
            </p>

            <label className="text-sm font-medium">Monto a abonar</label>
            <input type="number" step="0.01" min="0.01" max={cuentaActiva.saldo} required
              className="input-field mt-1 mb-3" value={monto}
              onChange={(e) => setMonto(e.target.value)} />

            <label className="text-sm font-medium">Método de pago</label>
            <select className="input-field mt-1 mb-5" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
            </select>

            <button type="submit" className="btn-primary w-full">Registrar abono</button>
          </form>
        </div>
      )}
    </div>
  );
}
