import { useState } from 'react'
import api from '../services/api'

export default function SubscribeForm(){
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try{
      const res = await api.post('subscribers/', { email, name })
      setMessage({ type: 'success', text: 'Suscripción recibida. Gracias.' })
      setEmail('')
      setName('')
    }catch(err){
      const txt = err?.response?.data?.detail || err?.response?.data || err.message
      setMessage({ type: 'error', text: String(txt) })
    }finally{
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-3">
      <div className="flex gap-2">
        <input type="text" placeholder="Nombre (opcional)" value={name} onChange={e=>setName(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        <input type="email" placeholder="Tu correo" value={email} onChange={e=>setEmail(e.target.value)} required className="w-44 px-3 py-2 rounded-lg border border-slate-200 text-sm" />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button type="submit" disabled={loading} className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700">
          {loading ? 'Enviando...' : 'Suscribirse'}
        </button>
        {message && (
          <span className={`${message.type === 'success' ? 'text-green-600' : 'text-rose-600'} text-xs`}>{message.text}</span>
        )}
      </div>
    </form>
  )
}
