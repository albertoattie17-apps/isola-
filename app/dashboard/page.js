"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, X, Trash2 } from "lucide-react";

export default function VentasPage() {
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [clienteId, setClienteId] = useState("");
  const [tipoPago, setTipoPago] = useState("contado");
  const [fechaVenc, setFechaVenc] = useState("");
  const [items, setItems] = useState([]); // {producto_id, variante_id, cantidad, precio_unitario}

  async function loadAll() {
    setLoading(true);
    const [{ data: v }, { data: c }, { data: p }] = await Promise.all([
      supabase.from("ventas").select("*, clientes(nombre)").order("fecha", { ascending: false }),
      supabase.from("clientes").select("id, nombre").order("nombre"),
      supabase
        .from("productos")
        .select("id, nombre, precio, activo, producto_variantes(*)")
        .eq("activo", true)
        .order("nombre"),
    ]);
    setVentas(v || []);
    setClientes(c || []);
    setProductos(p || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function openNew() {
    setClienteId("");
    setTipoPago("contado");
    setFechaVenc("");
    setItems([{ producto_id: "", variante_id: "", cantidad: 1, precio_unitario: 0 }]);
    setShowForm(true);
  }

  function addItem() {
    setItems([...items, { producto_id: "", variante_id: "", cantidad: 1, precio_unitario: 0 }]);
  }

  function updateItem(index, field, value) {
    const next = [...items];
    next[index][field] = value;
    if (field === "producto_id") {
      const prod = productos.find((p) => p.id === value);
      next[index].precio_unitario = prod ? Number(prod.precio) : 0;
      next[index].variante_id = ""; // reset talla al cambiar producto
    }
    setItems(next);
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index));
  }

  function variantesDe(productoId) {
    const prod = productos.find((p) => p.id === productoId);
    return prod?.producto_variantes || [];
  }

  const total = items.reduce(
    (acc, it) => acc + Number(it.cantidad || 0) * Number(it.precio_unitario || 0),
    0
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (items.length === 0 || items.some((it) => !it.producto_id || !it.variante_id)) {
      alert("Selecciona producto y talla en cada línea.");
      return;
    }
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: venta, error: ventaError } = await supabase
      .from("ventas")
      .insert({
        cliente_id: clienteId || null,
        total,
        tipo_pago: tipoPago,
        estado: "completada",
        usuario_email: user?.email,
      })
      .select()
      .single();

    if (ventaError) {
      alert("Error al crear la venta: " + ventaError.message);
      setSaving(false);
      return;
    }

    for (const it of items) {
      const subtotal = Number(it.cantidad) * Number(it.precio_unitario);
      await supabase.from("venta_items").insert({
        venta_id: venta.id,
        producto_id: it.producto_id,
        variante_id: it.variante_id,
        cantidad: Number(it.cantidad),
        precio_unitario: Number(it.precio_unitario),
        subtotal,
      });

      const variantes = variantesDe(it.producto_id);
      const variante = variantes.find((v) => v.id === it.variante_id);
      const nuevoStock = (variante?.stock || 0) - Number(it.cantidad);
      await supabase.from("producto_variantes").update({ stock: nuevoStock }).eq("id", it.variante_id);

      await supabase.from("movimientos_inventario").insert({
        producto_id: it.producto_id,
        variante_id: it.variante_id,
        tipo: "salida",
        cantidad: Number(it.cantidad),
        motivo: "Venta" + (variante ? ` (talla ${variante.talla})` : ""),
        usuario_email: user?.email,
      });
    }

    if (tipoPago === "credito") {
      await supabase.from("cuentas_por_cobrar").insert({
        venta_id: venta.id,
        cliente_id: clienteId || null,
        monto_total: total,
        monto_pagado: 0,
        saldo: total,
        fecha_vencimiento: fechaVenc || null,
        estado: "pendiente",
      });
    }

    setSaving(false);
    setShowForm(false);
    loadAll();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ocean-800">Ventas</h1>
          <p className="text-ocean-500">Registro de ventas realizadas</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nueva venta
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="beach-table w-full">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Tipo pago</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="text-center py-6 text-ocean-400">Cargando...</td></tr>}
            {!loading && ventas.length === 0 && (
              <tr><td colSpan={5} className="text-center py-6 text-ocean-400">No hay ventas registradas.</td></tr>
            )}
            {ventas.map((v) => (
              <tr key={v.id}>
                <td>{new Date(v.fecha).toLocaleString()}</td>
                <td>{v.clientes?.nombre || "Cliente general"}</td>
                <td className="capitalize">{v.tipo_pago}</td>
                <td>${Number(v.total).toFixed(2)}</td>
                <td className="capitalize">{v.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-ocean-900/40 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
          <form onSubmit={handleSubmit} className="card w-full max-w-2xl p-6 relative my-auto">
            <button type="button" onClick={() => setShowForm(false)} className="absolute right-4 top-4 text-ocean-400">
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold text-ocean-800 mb-4">Nueva venta</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-sm font-medium">Cliente</label>
                <select className="input-field mt-1" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                  <option value="">Cliente general</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Tipo de pago</label>
                <select className="input-field mt-1" value={tipoPago} onChange={(e) => setTipoPago(e.target.value)}>
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>
            </div>

            {tipoPago === "credito" && (
              <div className="mb-4">
                <label className="text-sm font-medium">Fecha de vencimiento</label>
                <input type="date" className="input-field mt-1" value={fechaVenc}
                  onChange={(e) => setFechaVenc(e.target.value)} />
              </div>
            )}

            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Productos</label>
                <button type="button" onClick={addItem} className="text-ocean-600 text-sm font-medium">
                  + Agregar producto
                </button>
              </div>

              {items.map((it, idx) => {
                const variantes = variantesDe(it.producto_id);
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                    <select
                      className="input-field col-span-12 sm:col-span-4"
                      value={it.producto_id}
                      onChange={(e) => updateItem(idx, "producto_id", e.target.value)}
                    >
                      <option value="">Producto</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>

                    <select
                      className="input-field col-span-6 sm:col-span-3"
                      value={it.variante_id}
                      disabled={!it.producto_id}
                      onChange={(e) => updateItem(idx, "variante_id", e.target.value)}
                    >
                      <option value="">Talla</option>
                      {variantes.map((v) => (
                        <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                          {v.talla} (stock: {v.stock})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number" min="1" className="input-field col-span-2"
                      value={it.cantidad}
                      onChange={(e) => updateItem(idx, "cantidad", e.target.value)}
                    />
                    <input
                      type="number" step="0.01" className="input-field col-span-3 sm:col-span-2"
                      value={it.precio_unitario}
                      onChange={(e) => updateItem(idx, "precio_unitario", e.target.value)}
                    />
                    <button type="button" onClick={() => removeItem(idx)} className="col-span-1 text-sunset-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="text-right text-lg font-bold text-ocean-800 mb-5">
              Total: ${total.toFixed(2)}
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? "Guardando..." : "Registrar venta"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
