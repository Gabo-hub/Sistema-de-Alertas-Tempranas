import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { alertsApi, zonesApi } from '../../services/api'
import { MapContainer, TileLayer, Marker, Polygon, Circle, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const TIPOS = [
  { value: 'SISMO', label: 'Sismos' },
  { value: 'INUNDACION', label: 'Inundaciones' },
  { value: 'DESLAVE', label: 'Deslaves' },
  { value: 'INCENDIO', label: 'Incendios' },
  { value: 'OTROS', label: 'Otros' },
]
const NIVELES = [
  { value: 'BAJO', label: 'Bajo' },
  { value: 'MEDIO', label: 'Medio' },
  { value: 'ALTO', label: 'Alto' },
  { value: 'CRITICO', label: 'Crítico' },
]

function MapClickHandler({ onClick }) {
  useMapEvents({
    click: (e) => onClick(e.latlng.lat, e.latlng.lng),
  })
  return null
}

function MapUpdater({ bounds, markerPos }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [20, 20] })
  }, [map, bounds])

  useEffect(() => {
    if (markerPos && !isNaN(markerPos[0]) && !isNaN(markerPos[1])) {
      map.panTo(markerPos)
    }
  }, [map, markerPos])

  return null
}

export default function AdminAlertForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [zones, setZones] = useState([])
  const [selectedZoneData, setSelectedZoneData] = useState(null)
  const [form, setForm] = useState({
    tipo_desastre: 'SISMO',
    nivel_riesgo: 'MEDIO',
    zona: '',
    fecha_hora: new Date().toISOString().slice(0, 16),
    descripcion: '',
    radio_impacto: 1000,
    activa: true,
  })
  const [pointLat, setPointLat] = useState('')
  const [pointLon, setPointLon] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    zonesApi.list().then((res) => setZones(res.results || res)).catch(() => { })
  }, [])

  useEffect(() => {
    if (form.zona) {
      zonesApi.get(form.zona)
        .then(z => setSelectedZoneData(z))
        .catch(() => setSelectedZoneData(null))
    } else {
      setSelectedZoneData(null)
    }
  }, [form.zona])

  useEffect(() => {
    if (!isEdit) return
    alertsApi
      .get(id)
      .then((a) => {
        setForm({
          tipo_desastre: a.tipo_desastre || 'SISMO',
          nivel_riesgo: a.nivel_riesgo || 'MEDIO',
          zona: a.zona ?? '',
          fecha_hora: a.fecha_hora ? new Date(a.fecha_hora).toISOString().slice(0, 16) : form.fecha_hora,
          descripcion: a.descripcion || '',
          radio_impacto: a.radio_impacto ?? 1000,
          activa: a.activa !== false,
        })
        if (a.point_geojson) {
          try {
            const geom = typeof a.point_geojson === 'string' ? JSON.parse(a.point_geojson) : a.point_geojson
            const c = geom?.coordinates
            if (c && c.length >= 2) {
              setPointLon(String(c[0]))
              setPointLat(String(c[1]))
            }
          } catch (_) { }
        }
      })
      .catch((err) => setError(err.message))
  }, [id, isEdit])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const payload = {
      ...form,
      zona: form.zona || null,
      radio_impacto: parseFloat(form.radio_impacto || 1000),
      fecha_hora: new Date(form.fecha_hora).toISOString(),
    }
    if (pointLat && pointLon) {
      const lat = parseFloat(pointLat)
      const lon = parseFloat(pointLon)
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        payload.point = { type: 'Point', coordinates: [lon, lat] }
      }
    } else {
      payload.point = null
    }

    const req = isEdit ? alertsApi.update(id, payload) : alertsApi.create(payload)
    req
      .then(() => navigate('/admin/alertas'))
      .catch((err) => {
        const msg = err.response?.data?.non_field_errors?.[0] ||
          err.response?.data?.detail ||
          err.message
        setError(msg)
      })
      .finally(() => setLoading(false))
  }

  let polygonCoords = null
  let bounds = null
  if (selectedZoneData?.geometry_geojson) {
    try {
      const g = selectedZoneData.geometry_geojson
      if (g.type === 'Polygon') {
        polygonCoords = g.coordinates[0].map(c => [c[1], c[0]])
        bounds = L.polyline(polygonCoords).getBounds()
      }
    } catch (_) { }
  }

  const handleMapClick = (lat, lng) => {
    setPointLat(lat.toFixed(6))
    setPointLon(lng.toFixed(6))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/admin/alertas" className="inline-flex items-center text-slate-500 hover:text-slate-900 transition-colors text-sm font-bold uppercase tracking-widest">
        ← Panel de Gestión
      </Link>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <header className="px-10 py-8 bg-slate-50 border-b border-slate-100">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isEdit ? 'Modificar Registro' : 'Nuevo Protocolo de Alerta'}
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Ingreso de datos geolocalizados</p>
        </header>

        <div className="p-10">
          {error && (
            <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 mb-8 animate-in fade-in slide-in-from-top-2">
              <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Error de Sincronización</p>
              <p className="text-xs text-rose-500 mt-1">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Evento</label>
                <select
                  value={form.tipo_desastre}
                  onChange={(e) => setForm((f) => ({ ...f, tipo_desastre: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-slate-900"
                >
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nivel de Riesgo</label>
                <select
                  value={form.nivel_riesgo}
                  onChange={(e) => setForm((f) => ({ ...f, nivel_riesgo: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-slate-900"
                >
                  {NIVELES.map((n) => (
                    <option key={n.value} value={n.value}>{n.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jurisdicción / Zona</label>
                <select
                  value={form.zona}
                  onChange={(e) => setForm((f) => ({ ...f, zona: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-slate-900"
                >
                  <option value="">— Ninguna (Global) —</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Guía Visual del Mapa */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Localización Precisa (Clic en el mapa)</label>
                  {bounds && (
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Límites Geográficos Activos</span>
                  )}
                </div>

                <div className="h-[300px] w-full rounded-3xl overflow-hidden border border-slate-100 shadow-inner">
                  <MapContainer
                    center={[10.2, -67.6]}
                    zoom={8}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapClickHandler onClick={handleMapClick} />
                    <MapUpdater
                      bounds={bounds}
                      markerPos={pointLat && pointLon ? [parseFloat(pointLat), parseFloat(pointLon)] : null}
                    />
                    {polygonCoords && (
                      <Polygon
                        positions={polygonCoords}
                        pathOptions={{ color: '#0F172A', weight: 2, fillColor: '#3B82F6', fillOpacity: 0.1 }}
                      />
                    )}
                    {pointLat && pointLon && !isNaN(parseFloat(pointLat)) && !isNaN(parseFloat(pointLon)) && (
                      <>
                        <Marker position={[parseFloat(pointLat), parseFloat(pointLon)]} />
                        <Circle
                          center={[parseFloat(pointLat), parseFloat(pointLon)]}
                          radius={parseFloat(form.radio_impacto || 0)}
                          pathOptions={{
                            color: form.nivel_riesgo === 'CRITICO' ? '#ef4444' : '#3b82f6',
                            fillColor: form.nivel_riesgo === 'CRITICO' ? '#ef4444' : '#3b82f6',
                            fillOpacity: 0.2,
                            className: 'pulse-circle'
                          }}
                        />
                      </>
                    )}
                  </MapContainer>
                </div>

                {/* Límites numéricos descriptivos con validación real-time */}
                {bounds && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in duration-500">
                    <div className={`space-y-1 p-2 rounded-xl transition-colors ${pointLat && (parseFloat(pointLat) < bounds.getSouth()) ? 'bg-rose-100' : ''}`}>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Latitud Mín</p>
                      <p className={`text-xs font-bold ${pointLat && (parseFloat(pointLat) < bounds.getSouth()) ? 'text-rose-600' : 'text-slate-900'}`}>
                        {bounds.getSouth().toFixed(4)}°
                      </p>
                    </div>
                    <div className={`space-y-1 p-2 rounded-xl transition-colors ${pointLat && (parseFloat(pointLat) > bounds.getNorth()) ? 'bg-rose-100' : ''}`}>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Latitud Máx</p>
                      <p className={`text-xs font-bold ${pointLat && (parseFloat(pointLat) > bounds.getNorth()) ? 'text-rose-600' : 'text-slate-900'}`}>
                        {bounds.getNorth().toFixed(4)}°
                      </p>
                    </div>
                    <div className={`space-y-1 p-2 rounded-xl transition-colors ${pointLon && (parseFloat(pointLon) < bounds.getWest()) ? 'bg-rose-100' : ''}`}>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Longitud Mín</p>
                      <p className={`text-xs font-bold ${pointLon && (parseFloat(pointLon) < bounds.getWest()) ? 'text-rose-600' : 'text-slate-900'}`}>
                        {bounds.getWest().toFixed(4)}°
                      </p>
                    </div>
                    <div className={`space-y-1 p-2 rounded-xl transition-colors ${pointLon && (parseFloat(pointLon) > bounds.getEast()) ? 'bg-rose-100' : ''}`}>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Longitud Máx</p>
                      <p className={`text-xs font-bold ${pointLon && (parseFloat(pointLon) > bounds.getEast()) ? 'text-rose-600' : 'text-slate-900'}`}>
                        {bounds.getEast().toFixed(4)}°
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitud</label>
                  <input
                    type="text"
                    value={pointLat}
                    onChange={(e) => setPointLat(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-slate-900"
                    placeholder="0.000000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitud</label>
                  <input
                    type="text"
                    value={pointLon}
                    onChange={(e) => setPointLon(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-slate-900"
                    placeholder="0.000000"
                  />
                </div>
              </div>

              <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Radio de Impacto Estimado</label>
                  <span className="text-xs font-black text-slate-900 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
                    {(form.radio_impacto / 1000).toFixed(1)} km
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={form.radio_impacto}
                  onChange={(e) => setForm((f) => ({ ...f, radio_impacto: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
                <div className="flex justify-between text-[8px] font-black text-slate-300 uppercase tracking-widest px-1">
                  <span>100m</span>
                  <span>5km</span>
                  <span>10km</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha y Hora del Suceso</label>
              <input
                type="datetime-local"
                value={form.fecha_hora}
                onChange={(e) => setForm((f) => ({ ...f, fecha_hora: e.target.value }))}
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción Técnica</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                rows={4}
                className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                placeholder="Detalles del evento e instrucciones..."
              />
            </div>

            <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <input
                id="activa-check"
                type="checkbox"
                checked={form.activa}
                onChange={(e) => setForm((f) => ({ ...f, activa: e.target.checked }))}
                className="w-6 h-6 text-slate-900 rounded-lg border-slate-200 focus:ring-slate-900"
              />
              <label htmlFor="activa-check" className="text-xs font-black uppercase tracking-widest text-slate-700 cursor-pointer">
                Publicar Alerta (Visible en Portal Público)
              </label>
            </div>

            <div className="pt-6 border-t border-slate-50 flex justify-end gap-4">
              <Link
                to="/admin/alertas"
                className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className={`px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-bezier shadow-xl shadow-slate-200 ${loading ? 'opacity-50 cursor-wait' : ''}`}
              >
                {loading ? 'Sincronizando...' : (isEdit ? 'Actualizar' : 'Registrar Alerta')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
