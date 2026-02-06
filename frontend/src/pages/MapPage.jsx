import { useState, useEffect, useCallback } from 'react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { alertsApi, zonesApi } from '../services/api'

const userIcon = new L.DivIcon({
  html: `<div class="relative flex items-center justify-center">
          <div class="absolute w-6 h-6 bg-blue-500/30 rounded-full animate-ping"></div>
          <div class="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>
        </div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

function CenterView({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, zoom ?? 8)
  }, [map, center, zoom])
  return null
}

export default function MapPage() {
  const [alerts, setAlerts] = useState([])
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [userPos, setUserPos] = useState(null)
  const [nearbyAlert, setNearbyAlert] = useState(null)

  const defaultCenter = [10.2, -67.6]
  const defaultZoom = 8

  useEffect(() => {
    let cancelled = false
    Promise.all([alertsApi.list({ activas: 'true' }), zonesApi.list()])
      .then(([alertsRes, zonesRes]) => {
        if (cancelled) return
        setAlerts(alertsRes.results || alertsRes)
        setZones(zonesRes.results || zonesRes)
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(
        (pos) => {
          setUserPos([pos.coords.latitude, pos.coords.longitude])
        },
        (err) => console.warn("Geolocation error:", err),
        { enableHighAccuracy: true }
      )
    }
  }, [])

  const checkDanger = useCallback(() => {
    if (!userPos || alerts.length === 0) return

    const danger = alerts.find(a => {
      let lat, lon
      try {
        const geojson = typeof a.point_geojson === 'string' ? JSON.parse(a.point_geojson) : a.point_geojson
        const c = geojson?.coordinates
        if (c) { lon = c[0]; lat = c[1] }
      } catch (_) { }

      if (lat == null || lon == null) return false

      const dist = getDistance(userPos[0], userPos[1], lat, lon)
      return dist <= (a.radio_impacto + 50)
    })

    setNearbyAlert(danger || null)
  }, [userPos, alerts])

  useEffect(() => {
    checkDanger()
  }, [checkDanger])

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-[3px] border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
      <span className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Cargando Cartografía</span>
    </div>
  )

  return (
    <div className="relative h-[75vh] w-full rounded-[40px] overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/50">

      {/* 4. BANNER DE ALERTA DE PELIGRO */}
      {nearbyAlert && (
        <div className="absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md z-[2000] animate-bounce">
          <div className="bg-rose-600 text-white p-4 md:p-5 rounded-[24px] shadow-2xl shadow-rose-200 border border-white/20 backdrop-blur-md flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center text-lg md:text-xl shrink-0">⚠️</div>
            <div>
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-80">Alerta de Proximidad</p>
              <h3 className="text-xs md:text-sm font-bold leading-tight">Estás en una zona de riesgo por {nearbyAlert.tipo_desastre_display}</h3>
              <p className="text-[9px] md:text-[10px] mt-1 font-medium italic opacity-90 hidden sm:block">Sigue los protocolos de seguridad de tu sector.</p>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-4 right-4 md:top-6 md:left-6 md:bottom-auto md:right-auto z-[30] md:max-w-sm pointer-events-none">
        <div className="glass-panel p-4 md:p-6 rounded-[24px] md:rounded-[32px] shadow-xl shadow-black/5 animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-top-4 duration-700 pointer-events-auto bg-white/80 backdrop-blur-md">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Mapa de Riesgos</h1>
          <p className="mt-2 text-xs font-semibold text-slate-500 leading-relaxed uppercase tracking-wider">
            Monitoreo geolocalizado de protocolos activos
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div>
              <span className="text-[10px] font-black uppercase text-slate-400">Zonas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-900 shadow-sm shadow-slate-200"></div>
              <span className="text-[10px] font-black uppercase text-slate-400">Eventos</span>
            </div>
            {userPos && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 shadow-sm shadow-blue-200"></div>
                <span className="text-[10px] font-black uppercase text-slate-400">Tu Ubicación</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OSM'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userPos && (
          <Marker position={userPos} icon={userIcon}>
            <Popup>
              <p className="text-xs font-bold p-1 text-slate-900 uppercase tracking-widest">Estás aquí</p>
            </Popup>
          </Marker>
        )}

        <CenterView center={defaultCenter} zoom={defaultZoom} />

        {zones.map((z) => {
          if (!z.geometry_geojson) return null
          let coords
          try {
            const geojson = typeof z.geometry_geojson === 'string' ? JSON.parse(z.geometry_geojson) : z.geometry_geojson
            coords = geojson?.coordinates?.[0]?.map(([lon, lat]) => [lat, lon])
          } catch (_) { return null }
          if (!coords || coords.length < 3) return null

          return (
            <Polygon
              key={`zone-${z.id}`}
              positions={coords}
              pathOptions={{
                color: '#0F172A',
                weight: 1,
                fillColor: '#3b82f6',
                fillOpacity: 0.05
              }}
            >
              <Popup className="minimalist-popup">
                <div className="p-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Localidad</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{z.nombre}</p>
                </div>
              </Popup>
            </Polygon>
          )
        })}

        {alerts.map((a) => {
          if (!a.point_geojson) return null
          let lat, lon
          try {
            const geojson = typeof a.point_geojson === 'string' ? JSON.parse(a.point_geojson) : a.point_geojson
            const c = geojson?.coordinates
            if (c && c.length >= 2) {
              lon = c[0]
              lat = c[1]
            }
          } catch (_) { return null }
          if (lat == null || lon == null) return null

          return (
            <div key={`alert-group-${a.id}`}>
              <Marker position={[lat, lon]}>
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${a.nivel_riesgo === 'CRITICO' ? 'bg-rose-500' : 'bg-slate-900'}`}></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {a.nivel_riesgo_display}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {a.tipo_desastre_display}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-2 italic">{a.descripcion}</p>
                    <div className="mt-3 pt-3 border-t border-slate-50 flex flex-col gap-1">
                      <span className="text-[10px] font-semibold text-slate-400">
                        📍 {a.zona_nombre || 'Localización precisa'}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        🕒 {new Date(a.fecha_hora).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={[lat, lon]}
                radius={a.radio_impacto || 0}
                pathOptions={{
                  color: a.nivel_riesgo === 'CRITICO' ? '#ef4444' : '#3b82f6',
                  fillColor: a.nivel_riesgo === 'CRITICO' ? '#ef4444' : '#3b82f6',
                  fillOpacity: 0.15,
                  className: 'pulse-circle'
                }}
              />
            </div>
          )
        })}
      </MapContainer>
    </div>
  )
}
