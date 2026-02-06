import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { alertsApi, weatherApi } from '../services/api'

const RISK_CONFIG = {
  BAJO: { color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50/50' },
  MEDIO: { color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50/50' },
  ALTO: { color: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50/50' },
  CRITICO: { color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50/50' }
}

export default function AlertDetail() {
  const { id } = useParams()
  const [alert, setAlert] = useState(null)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    alertsApi.get(id)
      .then((a) => {
        if (!cancelled) setAlert(a)
        if (a.point_geojson) {
          try {
            const geom = typeof a.point_geojson === 'string' ? JSON.parse(a.point_geojson) : a.point_geojson
            const coords = geom?.coordinates
            if (coords && coords.length >= 2) {
              weatherApi.get(coords[1], coords[0]).then((w) => !cancelled && setWeather(w)).catch(() => { })
            }
          } catch (_) { }
        }
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [id])

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-[3px] border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
      <span className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Consultando Protocolo</span>
    </div>
  )

  if (error) return (
    <div className="max-w-2xl mx-auto p-8 bg-rose-50 rounded-[32px] border border-rose-100">
      <p className="text-xs font-black text-rose-700 uppercase tracking-widest">Error de Localización</p>
      <p className="text-sm text-rose-400 mt-1">{error}</p>
      <Link to="/alertas" className="mt-6 inline-block text-[10px] font-black underline uppercase tracking-widest">Ver otras alertas</Link>
    </div>
  )

  if (!alert) return null
  const config = RISK_CONFIG[alert.nivel_riesgo] || { color: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-50' }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      {/* Navigation Back */}
      <Link to="/alertas" className="group inline-flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors">
        <span className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-bezier">←</span>
        Explorar Alertas
      </Link>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        {/* Header Branding */}
        <div className={`h-2 ${config.color}`}></div>

        <div className="p-10 md:p-16">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${config.bg} ${config.text}`}>
                  {alert.nivel_riesgo_display}
                </span>
                <span className={`w-2 h-2 rounded-full ${alert.activa ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {alert.activa ? 'Impacto Activo' : 'Evento Cerrado'}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                {alert.tipo_desastre_display}
              </h1>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 min-w-[240px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cronología</p>
              <p className="text-sm font-bold text-slate-800">
                {new Date(alert.fecha_hora).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-xs font-medium text-slate-500 mt-1 uppercase">
                {new Date(alert.fecha_hora).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-10">
              <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Detalles del Reporte</h3>
                <div className="text-lg text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                  {alert.descripcion || 'Sin descripción técnica disponible para este evento.'}
                </div>
              </section>

              <section className="bg-slate-50/50 p-8 rounded-[32px] border border-dashed border-slate-200">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Coordenadas de Impacto</h3>
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <p className="text-xs font-black text-slate-900 uppercase">Localización</p>
                    <p className="text-sm font-bold text-slate-500 mt-1">{alert.zona_nombre || 'Nacional / Global'}</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar / Weather */}
            <div className="space-y-8">
              {weather ? (
                <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-xl shadow-slate-200">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Climatología Local</h3>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase">Estado</span>
                      <span className="text-sm font-bold capitalize">{weather.weather?.[0]?.description}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase">Temperatura</span>
                      <span className="text-2xl font-black">{Math.round(weather.main?.temp)}°C</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase">Humedad</span>
                      <span className="text-sm font-bold">{weather.main?.humidity}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase">Viento</span>
                      <span className="text-sm font-bold">{weather.wind?.speed} m/s</span>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3">
                    <span className="text-xl">📡</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sincronizado vía OpenWeather</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-200 border-dashed text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telemetry Offline</p>
                </div>
              )}

              <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4">Acción Recomendada</p>
                <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase">
                  Evacuar zonas bajas y seguir protocolos de defensa civil. Mantenerse informado mediante este portal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
