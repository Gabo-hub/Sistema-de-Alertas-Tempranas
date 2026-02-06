
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)
        try {
            const result = await login(username, password)
            if (result.success) {
                navigate('/dashboard')
            } else {
                setError(result.error)
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFD] px-6">
            <div className="w-full max-w-sm">
                {/* Bloque de Marca */}
                <div className="text-center mb-10">
                    <div className="inline-flex w-14 h-14 bg-slate-900 rounded-2xl items-center justify-center mb-6 shadow-xl shadow-slate-200">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Acceso al Sistema</h1>
                    <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">Protocolo de Emergencias v1.0</p>
                </div>

                {/* Formulario de Acceso */}
                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/50">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                            <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Error de Validación</p>
                            <p className="text-xs text-rose-500 mt-0.5 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1" htmlFor="username">
                                Identificador
                            </label>
                            <input
                                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-300"
                                id="username"
                                type="text"
                                placeholder="Admin ID"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1" htmlFor="password">
                                Clave de Acceso
                            </label>
                            <input
                                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-300"
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-bezier shadow-lg ${isLoading
                                ? 'bg-slate-200 text-slate-400 cursor-wait'
                                : 'bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 shadow-slate-200'
                                }`}
                        >
                            {isLoading ? 'Verificando...' : 'Autenticar'}
                        </button>
                    </form>
                </div>

                {/* Enlace para Volver al Inicio */}
                <div className="text-center mt-8">
                    <Link to="/" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors">
                        ← Volver al Portal Público
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Login
