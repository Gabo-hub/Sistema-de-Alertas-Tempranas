import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { alertsApi, zonesApi } from '../services/api'

export default function Home() {
    const [counts, setCounts] = useState({ alerts: 0, zones: 0 })

    useEffect(() => {
        Promise.all([
            alertsApi.list({ activas: 'true' }),
            zonesApi.list()
        ]).then(([a, z]) => {
            setCounts({
                alerts: a.count ?? (Array.isArray(a) ? a.length : 0),
                zones: z.count ?? (Array.isArray(z) ? z.length : 0)
            })
        }).catch(() => { })
    }, [])

    return (
        <div className="space-y-32 py-12">
            {/* Sección Principal */}
            <section className="relative overflow-hidden rounded-[80px] bg-slate-900 text-white p-12 md:p-24 shadow-2xl shadow-slate-200">
                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">Sistema Activo</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.95] mb-10">
                        Protección civil <br />
                        <span className="text-blue-400 italic font-medium">inteligente.</span>
                    </h1>
                    <p className="text-xl text-slate-400 font-medium leading-relaxed mb-14 max-w-2xl">
                        Plataforma de detección temprana y respuesta ante desastres. Monitorea riesgos geolocalizados y recibe alertas preventivas en tiempo real.
                    </p>
                    <div className="flex flex-wrap gap-6">
                        <Link
                            to="/mapa"
                            className="px-12 py-6 bg-white text-slate-900 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-400 hover:text-white transition-bezier shadow-2xl shadow-white/5"
                        >
                            Ir al Mapa Vivo
                        </Link>
                        <Link
                            to="/alertas"
                            className="px-12 py-6 bg-transparent border-2 border-white/10 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-white/5 transition-bezier"
                        >
                            Ver Alertas
                        </Link>
                    </div>
                </div>

                {/* Decoración de Fondo */}
                <div className="absolute top-0 right-0 w-[600px] h-full bg-gradient-to-l from-blue-500/20 via-blue-500/5 to-transparent pointer-events-none skew-x-12 transform translate-x-20"></div>
                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
            </section>

            {/* Sección de Protocolos de Emergencia */}
            <section className="space-y-16">
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-4">Manual de Supervivencia</h2>
                    <p className="text-4xl font-black text-slate-900 tracking-tight">Protocolos de Actuación Ciudadana</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { icon: '🌋', title: 'Sismos', desc: 'Agáchese, cúbrase y agárrese. Manténgase alejado de cristales y objetos que puedan caer.' },
                        { icon: '🌊', title: 'Inundación', desc: 'Ubíquese en lugares elevados. No intente cruzar corrientes de agua a pie o en vehículo.' },
                        { icon: '🔥', title: 'Incendios', desc: 'Evacue inmediatamente. Si hay humo, desplácese gateando cerca del suelo.' },
                        { icon: '⚠️', title: 'General', desc: 'Mantenga la calma, informe a las autoridades y siga las rutas de evacuación señaladas.' },
                    ].map((p, i) => (
                        <div key={i} className="bg-slate-50 p-10 rounded-[40px] border border-slate-100 transition-bezier hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 group">
                            <div className="text-4xl mb-8 group-hover:scale-110 transition-transform duration-500">{p.icon}</div>
                            <h4 className="text-lg font-black text-slate-900 mb-4">{p.title}</h4>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{p.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Cuadrícula de Características */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-16 border-t border-slate-100 pt-32">
                <div className="space-y-6">
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-slate-200">🛰️</div>
                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Detección Satelital</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">Sincronización con redes de sensores para alertas en milisegundos.</p>
                </div>
                <div className="space-y-6">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-blue-100">🗺️</div>
                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Geofencing Real</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">Delimitación precisa para que recibas avisos solo si estás en riesgo.</p>
                </div>
                <div className="space-y-6">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900 text-xl border border-slate-200">📊</div>
                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Análisis Predictivo</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">Estadísticas avanzadas para la planificación urbana y prevención comunal.</p>
                </div>
            </section>

            {/* Estadísticas Dinámicas */}
            <section className="bg-slate-900 rounded-[60px] p-16 md:p-24 text-white flex flex-col md:flex-row items-center justify-around gap-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full opacity-10">
                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 100 L100 0 L100 100 Z" fill="white" />
                    </svg>
                </div>

                <div className="text-center relative z-10">
                    <p className="text-7xl font-black mb-2 tracking-tighter text-blue-400">{counts.alerts}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Alertas Activas</p>
                </div>
                <div className="w-px h-24 bg-white/10 hidden md:block relative z-10"></div>
                <div className="text-center relative z-10">
                    <p className="text-7xl font-black mb-2 tracking-tighter text-white">{counts.zones}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Zonas Protegidas</p>
                </div>
                <div className="w-px h-24 bg-white/10 hidden md:block relative z-10"></div>
                <div className="text-center relative z-10">
                    <p className="text-7xl font-black mb-2 tracking-tighter text-emerald-400">24/7</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Respuesta</p>
                </div>
            </section>
        </div>
    )
}
