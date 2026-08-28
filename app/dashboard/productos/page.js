"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Pencil, Trash2, X } from "lucide-react";

const empty = {
  id: null,
  nombre: "",
  descripcion: "",
  categoria: "",
  precio: "",
  costo: "",
  stock: "",
  stock_minimo: 5,
};

export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadProductos() {
    setLoading(true);
    const { data } = await supabase
      .from("productos")
      .select("*")
      .order("created_at", { ascending: false });
    setProductos(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadProductos();
  }, []);

  function openNew() {
    setForm(empty);
    setShowForm(true);
  }

  function openEdit(p) {
    setForm(p);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      categoria: form.categoria,
      precio: Number(form.precio) || 0,
      costo: Number(form.costo) || 0,
      stock: Number(form.stock) || 0,
      stock_minimo: Number(form.stock_minimo) || 0,
    };

    if (form.id) {
      await supabase.from("productos").update(payload).eq("id", form.id);
    } else {
      await supabase.from("productos").insert(payload);
    }
    setShowForm(false);
    loadProductos();
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este producto?")) return;
    await supabase.from("productos").delete().eq("id", id);
    loadProductos();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ocean-800">Productos</h1>
          <p className="text-ocean-500">Catálogo de productos y precios</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nuevo producto
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="beach-table w-full">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Costo</th>
              <th>Stock</th>
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
                <td>${Number(p.precio).toFixed(2)}</td>
                <td>${Number(p.costo).toFixed(2)}</td>
                <td>
                  <span className={p.stock <= p.stock_minimo ? "text-sunset-600 font-semibold" : ""}>
                    {p.stock}
                  </span>
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
        <div className="fixed inset-0 bg-ocean-900/40 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleSubmit} className="card w-full max-w-md p-6 relative">
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

            <div className="grid grid-cols-2 gap-3 mb-3">
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

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="text-sm font-medium">Stock inicial</label>
                <input type="number" required className="input-field mt-1" value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Stock mínimo</label>
                <input type="number" className="input-field mt-1" value={form.stock_minimo}
                  onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })} />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full">Guardar</button>
          </form>
        </div>
      )}
    </div>
  );
}
