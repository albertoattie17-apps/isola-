"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Pencil, Trash2, X } from "lucide-react";

const empty = { id: null, nombre: "", telefono: "", email: "", direccion: "" };

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadClientes() {
    setLoading(true);
    const { data } = await supabase
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false });
    setClientes(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadClientes();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      nombre: form.nombre,
      telefono: form.telefono,
      email: form.email,
      direccion: form.direccion,
    };
    if (form.id) {
      await supabase.from("clientes").update(payload).eq("id", form.id);
    } else {
      await supabase.from("clientes").insert(payload);
    }
    setShowForm(false);
    loadClientes();
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este cliente?")) return;
    await supabase.from("clientes").delete().eq("id", id);
    loadClientes();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ocean-800">Clientes</h1>
          <p className="text-ocean-500">Directorio de clientes</p>
        </div>
        <button onClick={() => { setForm(empty); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nuevo cliente
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="beach-table w-full">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Dirección</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="text-center py-6 text-ocean-400">Cargando...</td></tr>}
            {!loading && clientes.length === 0 && (
              <tr><td colSpan={5} className="text-center py-6 text-ocean-400">No hay clientes registrados.</td></tr>
            )}
            {clientes.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.nombre}</td>
                <td>{c.telefono || "-"}</td>
                <td>{c.email || "-"}</td>
                <td>{c.direccion || "-"}</td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => { setForm(c); setShowForm(true); }} className="text-ocean-600 hover:text-ocean-800">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="text-sunset-500 hover:text-sunset-700">
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
              {form.id ? "Editar cliente" : "Nuevo cliente"}
            </h2>

            <label className="text-sm font-medium">Nombre</label>
            <input required className="input-field mt-1 mb-3" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} />

            <label className="text-sm font-medium">Teléfono</label>
            <input className="input-field mt-1 mb-3" value={form.telefono || ""}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })} />

            <label className="text-sm font-medium">Email</label>
            <input type="email" className="input-field mt-1 mb-3" value={form.email || ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />

            <label className="text-sm font-medium">Dirección</label>
            <input className="input-field mt-1 mb-5" value={form.direccion || ""}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })} />

            <button type="submit" className="btn-primary w-full">Guardar</button>
          </form>
        </div>
      )}
    </div>
  );
}
