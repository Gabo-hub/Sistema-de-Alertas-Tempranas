import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { statisticsApi } from '../services/api'
import { Link } from 'react-router-dom'

const TIPO_LABELS = { SISMO: 'Sismos', INUNDACION: 'Inundaciones', DESLAVE: 'Deslaves', INCENDIO: 'Incendios', OTROS: 'Otros' }
const NIVEL_LABELS = { BAJO: 'Bajo', MEDIO: 'Medio', ALTO: 'Alto', CRITICO: 'Crítico' }
const NIVEL_COLORS = {
  BAJO: '#94A3B8',
  MEDIO: '#3B82F6',
  ALTO: '#F59E0B',
  CRITICO: '#EF4444'
}
const FALLBACK_COLORS = ['#0F172A', '#334155', '#64748B', '#94A3B8', '#CBD5E1']

const StatCard = ({ title, subtitle, footer, height = "260px", children }) => (
  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm transition-bezier group hover:shadow-xl hover:shadow-slate-200/40">
    <div className="mb-8">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h3>
      {subtitle && <p className="text-2xl font-black text-slate-900 tracking-tight leading-none mt-2">{subtitle}</p>}
    </div>
    <div style={{ height }} className="w-full">
      {children}
    </div>
    {footer && <div className="mt-6 pt-6 border-t border-slate-50">{footer}</div>}
  </div>
)

const MetricWidget = ({ label, value, colorClass, icon }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
    <div className={`w-14 h-14 rounded-2xl ${colorClass} flex items-center justify-center text-xl shadow-inner`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  </div>
)

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    statisticsApi.get()
      .then(data => !cancelled && setStats(data))
      .catch(err => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-[3px] border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
      <span className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando Sistema</span>
    </div>
  )

  if (error) return (
    <div className="bg-rose-50 p-8 rounded-[32px] border border-rose-100 max-w-2xl mx-auto">
      <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Error de Sincronización</p>
      <p className="text-sm text-rose-500 mt-2 font-medium">{error}</p>
    </div>
  )

  const porTipo = (stats?.por_tipo || []).map(t => ({ name: TIPO_LABELS[t.tipo_desastre] || t.tipo_desastre, value: t.total }))
  const porNivel = (stats?.por_nivel || []).map(n => ({
    name: NIVEL_LABELS[n.nivel_riesgo] || n.nivel_riesgo,
    value: n.total,
    code: n.nivel_riesgo
  }))
  const porZona = (stats?.por_zona || []).slice(0, 5)
  const tendencia = (stats?.tendencia || [])
  const resumen = stats?.resumen || {}
  const recientes = stats?.alertas_recientes || []

  return (
    <div className="space-y-12 pb-12">
      {/* Cabecera Principal */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-xl">
          <h1 className="text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">
            Centro de <span className="text-blue-600">Control</span> e Inteligencia
          </h1>
          <p className="mt-4 text-slate-500 font-medium">Análisis en tiempo real de protocolos de emergencia y cobertura territorial.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/alertas" className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-bezier shadow-lg shadow-slate-200">Gestionar Alertas</Link>
          <Link to="/" className="px-6 py-3 bg-white border border-slate-100 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-bezier shadow-sm">Ver Mapa Público</Link>
        </div>
      </section>

      {/* Cuadrícula de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricWidget label="Total Alertas" value={resumen.total_alertas} colorClass="bg-slate-900 text-white" icon="📊" />
        <MetricWidget label="Alertas Activas" value={resumen.alertas_activas} colorClass="bg-blue-100 text-blue-600" icon="📡" />
        <MetricWidget label="Nivel Crítico" value={resumen.alertas_criticas} colorClass="bg-rose-100 text-rose-600" icon="⚠️" />
        <MetricWidget label="Zonas Definidas" value={resumen.total_zonas} colorClass="bg-emerald-100 text-emerald-600" icon="🗺️" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Columna de Gráficos */}
        <div className="lg:col-span-2 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <StatCard title="Distribución de Riesgos" subtitle="Impacto por Nivel">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={porNivel}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    stroke="none"
                  >
                    {porNivel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={NIVEL_COLORS[entry.code] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 30px -5px rgba(0,0,0,0.1)', padding: '16px' }}
                    itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </StatCard>

            <StatCard title="Tipos de Desastres" subtitle="Frecuencia Histórica">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porTipo} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 800 }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#E2E8F0', fontSize: 10 }} />
                  <Tooltip
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" fill="#0F172A" radius={[8, 8, 8, 8]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </StatCard>
          </div>

          <StatCard title="Tendencia de Reportes" subtitle="Dinámica de los últimos 30 días" height="300px">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tendencia} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 800 }}
                  tickFormatter={(str) => {
                    const d = new Date(str);
                    return d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
                  }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#E2E8F0', fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 30px -5px rgba(0,0,0,0.1)' }} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3B82F6"
                  strokeWidth={5}
                  dot={{ r: 0 }}
                  activeDot={{ r: 8, fill: '#3B82F6', strokeWidth: 4, stroke: '#FFF' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </StatCard>
        </div>

        {/* Columna Lateral */}
        <div className="space-y-10">
          <StatCard title="Zonas Críticas" subtitle="Top Localidades" height="auto">
            <div className="space-y-6 mt-6 pb-2">
              {porZona.map((z, idx) => (
                <div key={idx} className="flex items-center group cursor-default">
                  <div className="flex-grow">
                    <div className="flex justify-between mb-2 items-center">
                      <span className="text-xs font-black text-slate-900 tracking-tight">{z.zona__nombre}</span>
                      <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-600 transition-colors uppercase">{z.total} Eventos</span>
                    </div>
                    <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden border border-slate-100">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                        style={{ width: `${(z.total / (porZona[0]?.total || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
              {porZona.length === 0 && <p className="text-slate-300 text-xs font-bold italic">Sin registros territoriales.</p>}
            </div>
          </StatCard>

          <StatCard title="Actividad Reciente" subtitle="Últimos Eventos" height="auto">
            <div className="space-y-4 mt-6">
              {recientes.map((a) => (
                <div key={a.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-300 hover:bg-white transition-bezier group">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${a.nivel_riesgo === 'CRITICO' ? 'bg-rose-100 text-rose-600' :
                      a.nivel_riesgo === 'ALTO' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-600'
                      }`}>
                      {a.nivel_riesgo_display}
                    </span>
                    <span className="text-[8px] font-black text-slate-400 uppercase">
                      {new Date(a.fecha_hora).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">{a.tipo_desastre_display}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">📍 {a.zona_nombre || 'Global'}</p>
                </div>
              ))}
              {recientes.length === 0 && <p className="text-slate-300 text-xs font-bold italic">No hay actividad reciente.</p>}
            </div>
          </StatCard>
        </div>
      </div>
    </div>
  )
}
