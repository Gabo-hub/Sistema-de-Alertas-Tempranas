import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { alertsApi } from '../../services/api'

const RISK_BADGES = {
  BAJO: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  MEDIO: 'bg-amber-50 text-amber-700 border-amber-100',
  ALTO: 'bg-orange-50 text-orange-700 border-orange-100',
  CRITICO: 'bg-rose-50 text-rose-700 border-rose-100'
}

export default function AdminAlertList() {
  const [data, setData] = useState({ results: [], count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    alertsApi.list({})
      .then((res) => {
        setData({ results: res.results || res, count: res.count ?? (res.results || res).length })
        setError(null)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  const handleDelete = (id, titulo) => {
    if (!window.confirm(`¿Confirmar eliminación de "${titulo}"?`)) return
    alertsApi.delete(id)
      .then(() => load())
      .catch((err) => setError(err.message))
  }

  const exportUrl = alertsApi.exportUrl()

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Cabecera del Administrador */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Gestión de Alertas</h1>
          <p className="mt-3 text-slate-500 font-medium leading-relaxed">
            Módulo de administración centralizada. Cree, edite o exporte reportes técnicos de incidentes a nivel nacional.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <Link
            to="/admin/alertas/nueva"
            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-[0.15em] hover:bg-slate-800 transition-bezier shadow-lg shadow-slate-200"
          >
            + Crear Evento
          </Link>
          <label className="cursor-pointer px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-[0.15em] hover:bg-slate-50 transition-bezier shadow-sm">
            Importar XLS
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files[0]
                if (!file) return
                const formData = new FormData()
                formData.append('file', file)
                try {
                  setLoading(true)
                  const res = await alertsApi.import(formData)
                  alert(res.message || 'Importación completada')
                  load()
                } catch (err) {
                  setError(err.message || 'Error importando archivo')
                } finally {
                  setLoading(false)
                  e.target.value = ''
                }
              }}
            />
          </label>
          <a
            href={exportUrl}
            download
            className="px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-[0.15em] hover:bg-slate-50 transition-bezier shadow-sm"
          >
            Exportar XLS
          </a>
        </div>
      </header>

      {/* Mensaje de Error */}
      {error && (
        <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 animate-in fade-in slide-in-from-top-2">
          <p className="text-xs font-black text-rose-700 uppercase tracking-widest">Error del Sistema</p>
          <p className="text-xs text-rose-500 mt-1">{error}</p>
        </div>
      )}

      {/* Tabla de Datos */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-[3px] border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
            <span className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Sincronizando</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría & Riesgo</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Localidad</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">CRONOS</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Comandos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.results.map((a) => (
                  <tr key={a.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-6">
                      <div className="text-sm font-bold text-slate-900 tracking-tight">{a.tipo_desastre_display}</div>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${RISK_BADGES[a.nivel_riesgo]}`}>
                        {a.nivel_riesgo_display}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-xs font-bold text-slate-500">
                      {a.zona_nombre || <span className="opacity-30 italic">Global</span>}
                    </td>
                    <td className="px-10 py-6 text-xs font-bold text-slate-400">
                      {new Date(a.fecha_hora).toLocaleDateString('es-VE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${a.activa ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${a.activa ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {a.activa ? 'Activo' : 'Cerrado'}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button
                          onClick={() => navigate(`/admin/alertas/${a.id}/editar`)}
                          className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl hover:bg-slate-900 hover:text-white transition-bezier shadow-sm"
                        >
                          <span className="text-xs">✎</span>
                        </button>
                        <button
                          onClick={() => handleDelete(a.id, `${a.tipo_desastre_display} ${a.nivel_riesgo_display}`)}
                          className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl hover:bg-rose-500 hover:text-white transition-bezier shadow-sm"
                        >
                          <span className="text-xs">✕</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.results.length === 0 && (
              <div className="py-24 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Base de datos vacía</p>
                <Link to="/admin/alertas/nueva" className="mt-4 inline-block text-[10px] font-black text-slate-900 border-b-2 border-slate-900 pb-1">COMENZAR REGISTRO</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
