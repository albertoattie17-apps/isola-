"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Pencil, Trash2, X } from "lucide-react";

const emptyProducto = {
  id: null,
  nombre: "",
  descripcion: "",
  categoria: "",
  precio: "",
  costo: "",
};

export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState(emptyProducto);
  const [tallas, setTallas] = useState([{ id: null, talla: "", stock: 0, stock_minimo: 5 }]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadProductos() {
    setLoading(true);
    const { data } = await supabase
      .from("productos")
      .select("*, producto_variantes(*)")
      .order("created_at", { ascending: false });
    setProductos(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadProductos();
  }, []);

  function openNew() {
    setForm(emptyProducto);
    setTallas([{ id: null, talla: "", stock: 0, stock_minimo: 5 }]);
    setShowForm(true);
  }

  function openEdit(p) {
    setForm(p);
    setTallas(
      p.producto_variantes && p.producto_variantes.length > 0
        ? p.producto_variantes.map((v) => ({
            id: v.id,
            talla: v.talla,
            stock: v.stock,
            stock_minimo: v.stock_minimo,
          }))
        : [{ id: null, talla: "", stock: 0, stock_minimo: 5 }]
    );
    setShowForm(true);
  }

  function addTalla() {
    setTallas([...tallas, { id: null, talla: "", stock: 0, stock_minimo: 5 }]);
  }

  function updateTalla(index, field, value) {
    const next = [...tallas];
    next[index][field] = value;
    setTallas(next);
  }

  function removeTalla(index) {
    setTallas(tallas.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      categoria: form.categoria,
      precio: Number(form.precio) || 0,
      costo: Number(form.costo) || 0,
    };

    // El color solo se envía si el formulario lo trae (así no falla si la columna aún no existe)
    if ("color" in form) payload.color = (form.color || "").trim() || null;

    let productoId = form.id;

    if (productoId) {
      const { error } = await supabase.from("productos").update(payload).eq("id", productoId);
      if (error) {
        alert("No se pudo guardar el producto: " + error.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase.from("productos").insert(payload).select().single();
      if (error) {
        alert("Error al crear producto: " + error.message);
        setSaving(false);
        return;
      }
      productoId = data.id;
    }

    // Tallas válidas (con nombre de talla escrito)
    const tallasValidas = tallas.filter((t) => t.talla.trim() !== "");

    // Eliminar tallas que el usuario quitó del formulario (solo si eran existentes)
    if (form.id) {
      const idsActuales = tallasValidas.filter((t) => t.id).map((t) => t.id);
      const idsOriginales = (form.producto_variantes || []).map((v) => v.id);
      const idsAEliminar = idsOriginales.filter((id) => !idsActuales.includes(id));
      for (const id of idsAEliminar) {
        await supabase.from("producto_variantes").delete().eq("id", id);
      }
    }

    // Actualizar o crear cada talla
    for (const t of tallasValidas) {
      const tallaPayload = {
        producto_id: productoId,
        talla: t.talla,
        stock: Number(t.stock) || 0,
        stock_minimo: Number(t.stock_minimo) || 0,
      };
      if (t.id) {
        await supabase.from("producto_variantes").update(tallaPayload).eq("id", t.id);
      } else {
        await supabase.from("producto_variantes").insert(tallaPayload);
      }
    }

    setSaving(false);
    setShowForm(false);
    loadProductos();
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este producto y todas sus tallas?")) return;
    await supabase.from("productos").delete().eq("id", id);
    loadProductos();
  }

  function stockTotal(p) {
    return (p.producto_variantes || []).reduce((acc, v) => acc + v.stock, 0);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ocean-800">Productos</h1>
          <p className="text-ocean-500">Catálogo, precios y tallas</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nuevo producto
        </button>
      </div>

      {/* Celular: una tarjeta por producto */}
      <div className="md:hidden space-y-3">
        {loading && (
          <div className="card p-6 text-center text-ocean-400">Cargando...</div>
        )}
        {!loading && productos.length === 0 && (
          <div className="card p-6 text-center text-ocean-400">No hay productos registrados.</div>
        )}
        {productos.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-ocean-900 break-words">{p.nombre}</p>
                <p className="text-xs text-ocean-500 mt-0.5">{p.categoria || "Sin categoría"}</p>
                {p.color && (
                  <p className="text-sm text-ocean-800 mt-1">
                    <span className="text-ocean-500">Color:</span>{" "}
                    <span className="font-medium">{p.color}</span>
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-ocean-800">${Number(p.precio).toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-ocean-100">
              <p className="text-xs font-semibold text-ocean-600 uppercase tracking-wide mb-2">
                Tallas / Stock
              </p>
              <div className="flex flex-wrap gap-2">
                {(p.producto_variantes || []).map((v) => (
                  <span
                    key={v.id}
                    className={`text-sm px-3 py-1 rounded-full border ${
                      v.stock <= v.stock_minimo
                        ? "border-sunset-400 text-sunset-600 bg-sunset-400/10"
                        : "border-ocean-200 text-ocean-700 bg-white"
                    }`}
                  >
                    <span className="font-semibold">{v.talla}</span>
                    <span className="mx-1 text-ocean-300">·</span>
                    {v.stock}
                  </span>
                ))}
                {(!p.producto_variantes || p.producto_variantes.length === 0) && (
                  <span className="text-sm text-ocean-400">Sin tallas</span>
                )}
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-4">
              <button onClick={() => openEdit(p)} className="flex items-center gap-1 text-sm text-ocean-600 hover:text-ocean-800">
                <Pencil size={15} /> Editar
              </button>
              <button onClick={() => handleDelete(p.id)} className="flex items-center gap-1 text-sm text-sunset-500 hover:text-sunset-600">
                <Trash2 size={15} /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Computadora: tabla */}
      <div className="card overflow-x-auto hidden md:block">
        <table className="beach-table w-full">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Color</th>
              <th>Precio</th>
              <th>Tallas / Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center py-6 text-ocean-400">Cargando...</td></tr>
            )}
            {!loading && productos.length === 0 && (
              <tr><td colSpan={6} className="text-center py-6 text-ocean-400">No hay productos registrados.</td></tr>
            )}
            {productos.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">{p.nombre}</td>
                <td>{p.categoria || "-"}</td>
                <td>{p.color || "-"}</td>
                <td>${Number(p.precio).toFixed(2)}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {(p.producto_variantes || []).map((v) => (
                      <span
                        key={v.id}
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          v.stock <= v.stock_minimo
                            ? "border-sunset-400 text-sunset-600"
                            : "border-ocean-200 text-ocean-700"
                        }`}
                      >
                        {v.talla}: {v.stock}
                      </span>
                    ))}
                    {(!p.producto_variantes || p.producto_variantes.length === 0) && (
                      <span className="text-xs text-ocean-400">Sin tallas</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-ocean-600 hover:text-ocean-800">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-sunset-500 hover:text-sunset-700">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-ocean-900/40 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
          <form onSubmit={handleSubmit} className="card w-full max-w-lg p-6 relative my-auto">
            <button type="button" onClick={() => setShowForm(false)} className="absolute right-4 top-4 text-ocean-400">
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold text-ocean-800 mb-4">
              {form.id ? "Editar producto" : "Nuevo producto"}
            </h2>

            <label className="text-sm font-medium">Nombre</label>
            <input required className="input-field mt-1 mb-3" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} />

            <label className="text-sm font-medium">Descripción</label>
            <input className="input-field mt-1 mb-3" value={form.descripcion || ""}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />

            <label className="text-sm font-medium">Categoría</label>
            <input className="input-field mt-1 mb-3" value={form.categoria || ""}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })} />

            <label className="text-sm font-medium">Color</label>
            <input className="input-field mt-1 mb-3" placeholder="Ej. Rojo, Azul marino" value={form.color || ""}
              onChange={(e) => setForm({ ...form, color: e.target.value })} />

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-sm font-medium">Precio venta</label>
                <input type="number" step="0.01" required className="input-field mt-1" value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Costo</label>
                <input type="number" step="0.01" className="input-field mt-1" value={form.costo}
                  onChange={(e) => setForm({ ...form, costo: e.target.value })} />
              </div>
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Tallas y stock</label>
                <button type="button" onClick={addTalla} className="text-ocean-600 text-sm font-medium">
                  + Agregar talla
                </button>
              </div>

              {tallas.map((t, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                  <input
                    className="input-field col-span-5"
                    placeholder="Talla (ej. S, M, L, 38...)"
                    value={t.talla}
                    onChange={(e) => updateTalla(idx, "talla", e.target.value)}
                  />
                  <input
                    type="number" min="0" className="input-field col-span-3"
                    placeholder="Stock"
                    value={t.stock}
                    onChange={(e) => updateTalla(idx, "stock", e.target.value)}
                  />
                  <input
                    type="number" min="0" className="input-field col-span-3"
                    placeholder="Stock mín."
                    value={t.stock_minimo}
                    onChange={(e) => updateTalla(idx, "stock_minimo", e.target.value)}
                  />
                  <button type="button" onClick={() => removeTalla(idx)} className="col-span-1 text-sunset-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <p className="text-xs text-ocean-400 mt-1">
                Si el producto no maneja tallas, escribe una sola fila como "Única".
              </p>
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full mt-4">
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
