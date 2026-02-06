import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { alertsApi } from '../services/api'

const RISK_CONFIG = {
  BAJO: { color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50/50' },
  MEDIO: { color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50/50' },
  ALTO: { color: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50/50' },
  CRITICO: { color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50/50' }
}

export default function AlertList() {
  const [data, setData] = useState({ results: [], count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ activas: 'true', desde: '', hasta: '', zona: '' })

  useEffect(() => {
    let cancelled = false
    const params = {}
    if (filters.activas === 'true') params.activas = true
    if (filters.desde) params.desde = filters.desde
    if (filters.hasta) params.hasta = filters.hasta
    if (filters.zona) params.zona = filters.zona

    setLoading(true)
    alertsApi.list(params)
      .then((res) => {
        if (!cancelled) {
          setData({ results: res.results || res, count: res.count ?? (res.results || res).length })
          setError(null)
        }
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [filters])

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Search & Filter Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-md">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Alertas</h1>
          <p className="mt-3 text-slate-500 font-medium leading-relaxed">
            Relación de eventos detectados. Filtre por fecha o estado para un análisis detallado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
          <select
            className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer px-4 py-2 hover:bg-white rounded-xl transition-bezier"
            value={filters.activas}
            onChange={(e) => setFilters((f) => ({ ...f, activas: e.target.value }))}
          >
            <option value="true">Activas</option>
            <option value="false">Todas</option>
          </select>

          <div className="h-4 w-px bg-slate-200"></div>

          <input
            type="date"
            className="bg-transparent border-none text-[10px] font-black uppercase text-slate-500 focus:ring-0 px-2 py-2 hover:bg-white rounded-xl transition-bezier"
            value={filters.desde}
            onChange={(e) => setFilters((f) => ({ ...f, desde: e.target.value }))}
          />
        </div>
      </header>

      {/* Error State */}
      {error && (
        <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-4">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-bold text-rose-700 uppercase tracking-widest">Error al recuperar datos</p>
            <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-50 rounded-3xl animate-pulse border border-slate-100"></div>
          ))}
        </div>
      )}

      {/* Results List */}
      {!loading && !error && (
        <div className="grid gap-6">
          {data.results.map((a) => {
            const config = RISK_CONFIG[a.nivel_riesgo] || { color: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-50' }
            return (
              <Link
                key={a.id}
                to={`/alertas/${a.id}`}
                className="group block bg-white p-2 rounded-[32px] border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-bezier overflow-hidden"
              >
                <div className="flex items-center gap-6 p-4">
                  {/* Status Indicator */}
                  <div className={`w-14 h-14 shrink-0 rounded-2xl ${config.bg} flex items-center justify-center`}>
                    <div className={`w-3 h-3 rounded-full ${config.color} animate-pulse`}></div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${config.text}`}>
                        {a.nivel_riesgo_display}
                      </span>
                      <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {a.tipo_desastre_display}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 truncate group-hover:text-slate-900 transition-colors">
                      {a.descripcion || 'Sin descripción detallada'}
                    </h3>

                    <div className="flex items-center gap-6 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]">📍</span>
                        <span className="text-xs font-semibold text-slate-400">{a.zona_nombre || 'Global'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]">🕒</span>
                        <span className="text-xs font-semibold text-slate-400">
                          {new Date(a.fecha_hora).toLocaleDateString('es-VE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full bg-slate-50 group-hover:bg-slate-900 group-hover:text-white transition-bezier">
                    <span className="text-sm">→</span>
                  </div>
                </div>
              </Link>
            )
          })}

          {!loading && data.results.length === 0 && (
            <div className="py-20 text-center bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
              <span className="text-4xl mb-4 block">🔍</span>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Sin resultados</p>
              <p className="text-slate-300 text-xs mt-1">Intente ajustar los filtros de búsqueda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
