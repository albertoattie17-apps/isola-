"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PalmDecor from "@/components/PalmDecor";
import { Palmtree, Waves } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <PalmDecor className="absolute -left-10 -top-6 w-40 opacity-90" />
      <PalmDecor className="absolute -right-6 top-0 w-32 opacity-80 scale-x-[-1]" />
      <Waves className="absolute bottom-6 left-1/2 -translate-x-1/2 text-ocean-300" size={200} strokeWidth={0.5} />

      <form
        onSubmit={handleSubmit}
        className="card relative z-10 w-full max-w-sm p-8"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="bg-sand-100 rounded-full p-3 mb-2">
            <Palmtree className="text-palm-600" size={32} />
          </div>
          <h1 className="text-xl font-bold text-ocean-800">Tienda Playa</h1>
          <p className="text-sm text-ocean-500">Ingresa a tu cuenta</p>
        </div>

        {error && (
          <div className="bg-sunset-500/10 text-sunset-600 text-sm rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <label className="text-sm font-medium text-ocean-700">Correo</label>
        <input
          type="email"
          required
          className="input-field mt-1 mb-4"
          placeholder="tucorreo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="text-sm font-medium text-ocean-700">Contraseña</label>
        <input
          type="password"
          required
          className="input-field mt-1 mb-6"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>

        <p className="text-xs text-ocean-400 mt-4 text-center">
          Los usuarios se crean desde el panel de Supabase (Authentication).
        </p>
      </form>
    </div>
  );
}
