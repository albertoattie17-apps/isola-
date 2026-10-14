"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, X, Trash2 } from "lucide-react";

const clienteVacio = { nombre: "", telefono: "", email: "", direccion: "" };

export default function VentasPage() {
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [clienteId, setClienteId] = useState("");
  const [tipoPago, setTipoPago] = useState("contado");
  const [items, setItems] = useState([]); // {producto_id, variante_id, cantidad, precio_unitario}

  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState(clienteVacio);
  const [savingCliente, setSavingCliente] = useState(false);

  const [filtro, setFiltro] = useState("todas"); // todas | pendientes

  const [ventaAEliminar, setVentaAEliminar] = useState(null);
  const [abonosVenta, setAbonosVenta] = useState(0);
  const [eliminando, setEliminando] = useState(false);

  async function loadAll() {
    setLoading(true);
    const [{ data: v }, { data: c }, { data: p }] = await Promise.all([
      supabase
        .from("ventas")
        .select("*, clientes(nombre), cuentas_por_cobrar(saldo, estado, fecha_vencimiento)")
        .order("fecha", { ascending: false }),
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

  async function pedirEliminar(v) {
    setAbonosVenta(0);
    setVentaAEliminar(v);
    // Si la venta fue a crédito, vemos cuánto se ha abonado para avisarlo en la confirmación
    const { data } = await supabase
      .from("cuentas_por_cobrar")
      .select("monto_pagado")
      .eq("venta_id", v.id);
    setAbonosVenta((data || []).reduce((acc, c) => acc + Number(c.monto_pagado || 0), 0));
  }

  async function eliminarVenta() {
    const v = ventaAEliminar;
    if (!v) return;
    setEliminando(true);

    // 1. Guardamos lo vendido antes de borrar, para poder devolver el stock
    const { data: itemsVenta, error: errItems } = await supabase
      .from("venta_items")
      .select("producto_id, variante_id, cantidad")
      .eq("venta_id", v.id);
    if (errItems) {
      alert("No se pudo eliminar la venta: " + errItems.message);
      setEliminando(false);
      return;
    }

    // 2. Cuenta por cobrar de esa venta (sus abonos se borran con ella)
    const { error: errCxc } = await supabase
      .from("cuentas_por_cobrar")
      .delete()
      .eq("venta_id", v.id);
    if (errCxc) {
      alert("No se pudo eliminar la venta: " + errCxc.message);
      setEliminando(false);
      return;
    }

    // 3. La venta (sus renglones se borran con ella)
    const { error: errVenta } = await supabase.from("ventas").delete().eq("id", v.id);
    if (errVenta) {
      alert("No se pudo eliminar la venta: " + errVenta.message);
      setEliminando(false);
      return;
    }

    // 4. Devolver el stock a cada talla y dejarlo anotado en el historial de Inventario
    const {
      data: { user },
    } = await supabase.auth.getUser();
    for (const it of itemsVenta || []) {
      if (!it.variante_id) continue;
      const { data: variante } = await supabase
        .from("producto_variantes")
        .select("stock, talla")
        .eq("id", it.variante_id)
        .single();
      if (!variante) continue;
      await supabase
        .from("producto_variantes")
        .update({ stock: variante.stock + it.cantidad })
        .eq("id", it.variante_id);
      await supabase.from("movimientos_inventario").insert({
        producto_id: it.producto_id,
        variante_id: it.variante_id,
        tipo: "entrada",
        cantidad: it.cantidad,
        motivo: `Venta eliminada (talla ${variante.talla})`,
        usuario_email: user?.email,
      });
    }

    setEliminando(false);
    setVentaAEliminar(null);
    loadAll();
  }

  async function crearCliente() {
    const nombre = nuevoCliente.nombre.trim();
    if (!nombre) {
      alert("Escribe el nombre del cliente.");
      return;
    }
    setSavingCliente(true);
    // Se guarda en la misma tabla "clientes", así también aparece en la pantalla Clientes
    const { data, error } = await supabase
      .from("clientes")
      .insert({
        nombre,
        telefono: nuevoCliente.telefono.trim() || null,
        email: nuevoCliente.email.trim() || null,
        direccion: nuevoCliente.direccion.trim() || null,
      })
      .select("id, nombre")
      .single();
    setSavingCliente(false);

    if (error) {
      alert("No se pudo guardar el cliente: " + error.message);
      return;
    }

    setClientes((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setClienteId(data.id);
    setNuevoCliente(clienteVacio);
    setShowNuevoCliente(false);
  }

  function openNew() {
    setShowNuevoCliente(false);
    setNuevoCliente(clienteVacio);
    setClienteId("");
    setTipoPago("contado");
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
        fecha_vencimiento: null,
        estado: "pendiente",
      });
    }

    setSaving(false);
    setShowForm(false);
    loadAll();
  }

  // Estado de cobro de una venta: contado = pagada; crédito = según su cuenta por cobrar
  function pagoDe(v) {
    if (v.tipo_pago !== "credito") return { pendiente: false, saldo: 0, vencida: false };
    const cuentas = v.cuentas_por_cobrar || [];
    const saldo = cuentas.reduce((acc, c) => acc + Number(c.saldo || 0), 0);
    const pendiente = saldo > 0;
    const hoy = new Date().toISOString().slice(0, 10);
    const vencida = pendiente && cuentas.some((c) => c.fecha_vencimiento && c.fecha_vencimiento < hoy);
    return { pendiente, saldo, vencida };
  }

  const totalPendientes = ventas.filter((v) => pagoDe(v).pendiente).length;
  const ventasVisibles =
    filtro === "pendientes" ? ventas.filter((v) => pagoDe(v).pendiente) : ventas;
  const sinResultados = filtro === "pendientes"
    ? "No hay ventas pendientes de cobro."
    : "No hay ventas registradas.";

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

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFiltro("todas")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium ${
            filtro === "todas" ? "bg-ocean-600 text-white" : "bg-white text-ocean-600"
          }`}
        >
          Todas ({ventas.length})
        </button>
        <button
          onClick={() => setFiltro("pendientes")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium ${
            filtro === "pendientes" ? "bg-ocean-600 text-white" : "bg-white text-ocean-600"
          }`}
        >
          Pendientes ({totalPendientes})
        </button>
      </div>

      {/* Celular: una tarjeta por venta */}
      <div className="md:hidden space-y-3">
        {loading && (
          <div className="card p-6 text-center text-ocean-400">Cargando...</div>
        )}
        {!loading && ventasVisibles.length === 0 && (
          <div className="card p-6 text-center text-ocean-400">{sinResultados}</div>
        )}
        {ventasVisibles.map((v) => {
          const pago = pagoDe(v);
          return (
          <div key={v.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-ocean-900 break-words">
                  {v.clientes?.nombre || "Cliente general"}
                </p>
                <p className="text-xs text-ocean-500 mt-0.5">
                  {new Date(v.fecha).toLocaleString()}
                </p>
              </div>
              <p className="text-lg font-bold text-ocean-800 shrink-0">
                ${Number(v.total).toFixed(2)}
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-ocean-100 flex flex-wrap gap-2">
              <span
                className={`text-sm px-3 py-1 rounded-full border capitalize ${
                  v.tipo_pago === "credito"
                    ? "border-sand-400 text-sand-700 bg-sand-100"
                    : "border-ocean-200 text-ocean-700 bg-white"
                }`}
              >
                {v.tipo_pago === "credito" ? "Crédito" : "Contado"}
              </span>
              <span
                className={`text-sm px-3 py-1 rounded-full border capitalize ${
                  v.estado === "anulada"
                    ? "border-sunset-400 text-sunset-600 bg-sunset-400/10"
                    : "border-palm-300 text-palm-700 bg-palm-50"
                }`}
              >
                {v.estado}
              </span>
              <span
                className={`text-sm px-3 py-1 rounded-full border ${
                  pago.pendiente
                    ? "border-sunset-400 text-sunset-600 bg-sunset-400/10"
                    : "border-palm-300 text-palm-700 bg-palm-50"
                }`}
              >
                {pago.pendiente
                  ? `${pago.vencida ? "Vencida" : "Pendiente"} · $${pago.saldo.toFixed(2)}`
                  : "Pagada"}
              </span>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => pedirEliminar(v)}
                className="flex items-center gap-1 text-sm text-sunset-500 hover:text-sunset-600"
              >
                <Trash2 size={15} /> Eliminar
              </button>
            </div>
          </div>
          );
        })}
      </div>

      {/* Computadora: tabla */}
      <div className="card overflow-x-auto hidden md:block">
        <table className="beach-table w-full">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Tipo pago</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Cobro</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="text-center py-6 text-ocean-400">Cargando...</td></tr>}
            {!loading && ventasVisibles.length === 0 && (
              <tr><td colSpan={7} className="text-center py-6 text-ocean-400">{sinResultados}</td></tr>
            )}
            {ventasVisibles.map((v) => {
              const pago = pagoDe(v);
              return (
              <tr key={v.id}>
                <td>{new Date(v.fecha).toLocaleString()}</td>
                <td>{v.clientes?.nombre || "Cliente general"}</td>
                <td className="capitalize">{v.tipo_pago}</td>
                <td>${Number(v.total).toFixed(2)}</td>
                <td className="capitalize">{v.estado}</td>
                <td>
                  {pago.pendiente ? (
                    <span className="text-sunset-600 font-medium">
                      {pago.vencida ? "Vencida" : "Pendiente"} · ${pago.saldo.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-palm-600">Pagada</span>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => pedirEliminar(v)}
                    title="Eliminar venta"
                    aria-label="Eliminar venta"
                    className="text-sunset-500 hover:text-sunset-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
              );
            })}
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
                <button
                  type="button"
                  onClick={() => setShowNuevoCliente(!showNuevoCliente)}
                  className="mt-1 text-ocean-600 hover:text-ocean-800 text-sm font-medium"
                >
                  {showNuevoCliente ? "Cancelar nuevo cliente" : "+ Nuevo cliente"}
                </button>
              </div>
              <div>
                <label className="text-sm font-medium">Tipo de pago</label>
                <select className="input-field mt-1" value={tipoPago} onChange={(e) => setTipoPago(e.target.value)}>
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>
            </div>

            {showNuevoCliente && (
              <div
                className="rounded-xl border border-ocean-100 bg-ocean-50/60 p-3 mb-4"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    crearCliente();
                  }
                }}
              >
                <p className="text-sm font-semibold text-ocean-700 mb-2">Nuevo cliente</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-ocean-600">Nombre</label>
                    <input
                      className="input-field mt-1"
                      value={nuevoCliente.nombre}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-ocean-600">Teléfono</label>
                    <input
                      className="input-field mt-1" inputMode="tel"
                      value={nuevoCliente.telefono}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-ocean-600">Email</label>
                    <input
                      type="email" className="input-field mt-1"
                      value={nuevoCliente.email}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-ocean-600">Dirección</label>
                    <input
                      className="input-field mt-1"
                      value={nuevoCliente.direccion}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => { setShowNuevoCliente(false); setNuevoCliente(clienteVacio); }}
                    className="btn-secondary text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={crearCliente}
                    disabled={savingCliente}
                    className="btn-primary text-sm"
                  >
                    {savingCliente ? "Guardando..." : "Guardar cliente"}
                  </button>
                </div>
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

      {ventaAEliminar && (
        <div className="fixed inset-0 bg-ocean-900/40 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-sm p-6" role="alertdialog" aria-modal="true">
            <h2 className="text-lg font-bold text-ocean-800 mb-2">
              ¿Estás seguro de que quieres eliminar esta venta?
            </h2>
            <p className="text-sm text-ocean-700">
              {ventaAEliminar.clientes?.nombre || "Cliente general"} ·{" "}
              ${Number(ventaAEliminar.total).toFixed(2)}
            </p>
            <p className="text-xs text-ocean-500 mb-3">
              {new Date(ventaAEliminar.fecha).toLocaleString()}
            </p>
            <p className="text-sm text-ocean-700 mb-2">
              Se devolverá al inventario el stock de los productos vendidos. Esta acción no se puede deshacer.
            </p>
            {abonosVenta > 0 && (
              <p className="text-sm text-sunset-600 bg-sunset-400/10 rounded-lg px-3 py-2 mb-2">
                Esta venta ya tiene abonos por ${abonosVenta.toFixed(2)}. También se eliminarán.
              </p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setVentaAEliminar(null)}
                disabled={eliminando}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={eliminarVenta}
                disabled={eliminando}
                className="btn-danger"
              >
                {eliminando ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
