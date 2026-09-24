'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase' // ajusta al path que ya usas en tu proyecto

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setStatus(error ? 'error' : 'sent')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold mb-4">Recuperar contraseña</h1>
        <input
          type="email"
          required
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
        />
        <button type="submit" className="w-full bg-blue-600 text-white rounded py-2">
          Enviar enlace de recuperación
        </button>
        {status === 'sent' && <p className="text-green-600 mt-3">Revisa tu correo para continuar.</p>}
        {status === 'error' && <p className="text-red-600 mt-3">Hubo un error. Intenta de nuevo.</p>}
      </form>
    </div>
  )
}
