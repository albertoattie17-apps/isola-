"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, X, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export default function InventarioPage() {
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState("stock"); // stock | movimientos

  const [productoId, setProductoId] = useState("");
  const [tipo, setTipo] = useState("entrada");
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState("");

  async function loadAll() {
    setLoading(true);
    const [{ data: p }, { data: m }] = await Promise.all([
      supabase.from("productos").select("*").order("nombre"),
      supabase
        .from("movimientos_inventario")
        .select("*, productos(nombre)")
        .order("fecha", { ascending: false })
        .limit(50),
    ]);
    setProductos(p || []);
    setMovimientos(m || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function openNew() {
    setProductoId("");
    setTipo("entrada");
    setCantidad(1);
    setMotivo("");
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const prod = productos.find((p) => p.id === productoId);
    if (!prod) return;

    const cant = Number(cantidad);
    const nuevoStock = tipo === "entrada" ? prod.stock + cant : prod.stock - cant;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("productos").update({ stock: nuevoStock }).eq("id", productoId);
    await supabase.from("movimientos_inventario").insert({
      producto_id: productoId,
      tipo,
      cantidad: cant,
      motivo: motivo || (tipo === "entrada" ? "Ingreso de mercancía" : "Ajuste de salida"),
      usuario_email: user?.email,
    });

    setShowForm(false);
    loadAll();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ocean-800">Inventario</h1>
          <p className="text-ocean-500">Existencias y movimientos de stock</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Registrar movimiento
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("stock")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium ${tab === "stock" ? "bg-ocean-600 text-white" : "bg-white text-ocean-600"}`}
        >
          Stock actual
        </button>
        <button
          onClick={() => setTab("movimientos")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium ${tab === "movimientos" ? "bg-ocean-600 text-white" : "bg-white text-ocean-600"}`}
        >
          Historial de movimientos
        </button>
      </div>

      {tab === "stock" && (
        <div className="card overflow-x-auto">
          <table className="beach-table w-full">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock actual</th>
                <th>Stock mínimo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="text-center py-6 text-ocean-400">Cargando...</td></tr>}
              {productos.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.nombre}</td>
                  <td>{p.stock}</td>
                  <td>{p.stock_minimo}</td>
                  <td>
                    {p.stock <= p.stock_minimo ? (
                      <span className="text-sunset-600 font-semibold">Stock bajo</span>
                    ) : (
                      <span className="text-palm-600">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "movimientos" && (
        <div className="card overflow-x-auto">
          <table className="beach-table w-full">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.fecha).toLocaleString()}</td>
                  <td>{m.productos?.nombre}</td>
                  <td className="flex items-center gap-1 capitalize">
                    {m.tipo === "entrada" ? (
                      <ArrowUpCircle size={14} className="text-palm-600" />
                    ) : (
                      <ArrowDownCircle size={14} className="text-sunset-500" />
                    )}
                    {m.tipo}
                  </td>
                  <td>{m.cantidad}</td>
                  <td>{m.motivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-ocean-900/40 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleSubmit} className="card w-full max-w-md p-6 relative">
            <button type="button" onClick={() => setShowForm(false)} className="absolute right-4 top-4 text-ocean-400">
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold text-ocean-800 mb-4">Registrar movimiento</h2>

            <label className="text-sm font-medium">Producto</label>
            <select required className="input-field mt-1 mb-3" value={productoId}
              onChange={(e) => setProductoId(e.target.value)}>
              <option value="">Selecciona producto</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} (stock: {p.stock})</option>
              ))}
            </select>

            <label className="text-sm font-medium">Tipo de movimiento</label>
            <select className="input-field mt-1 mb-3" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="entrada">Entrada (ingreso de mercancía)</option>
              <option value="salida">Salida (ajuste / merma)</option>
            </select>

            <label className="text-sm font-medium">Cantidad</label>
            <input type="number" min="1" required className="input-field mt-1 mb-3" value={cantidad}
              onChange={(e) => setCantidad(e.target.value)} />

            <label className="text-sm font-medium">Motivo</label>
            <input className="input-field mt-1 mb-5" value={motivo}
              onChange={(e) => setMotivo(e.target.value)} placeholder="Opcional" />

            <button type="submit" className="btn-primary w-full">Guardar</button>
          </form>
        </div>
      )}
    </div>
  );
}
