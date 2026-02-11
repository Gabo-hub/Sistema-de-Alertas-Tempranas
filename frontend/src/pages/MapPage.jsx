import { useState, useEffect, useCallback } from 'react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { alertsApi, zonesApi } from '../services/api'
import SubscribeForm from '../components/SubscribeForm'

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

const MapController = ({ center, zoom, userPos, autoCenter, trigger }) => {
  const map = useMap()
  const [hasAutoCentered, setHasAutoCentered] = useState(false)

  useEffect(() => {
    if (center && !hasAutoCentered) map.setView(center, zoom ?? 8)
  }, [map, center, zoom, hasAutoCentered])

  useEffect(() => {
    if (userPos && autoCenter && !hasAutoCentered) {
      map.flyTo(userPos, 13, { duration: 1.5 })
      setHasAutoCentered(true)
    }
  }, [map, userPos, autoCenter, hasAutoCentered])

  useEffect(() => {
    if (trigger && userPos) {
      map.flyTo(userPos, 15, { duration: 1 })
    }
  }, [trigger, userPos, map])

  return null
}

export default function MapPage() {
  const [alerts, setAlerts] = useState([])
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [userPos, setUserPos] = useState(null)
  const [nearbyAlert, setNearbyAlert] = useState(null)
  const [manualCenterTrigger, setManualCenterTrigger] = useState(0)
  const [showProximityAlert, setShowProximityAlert] = useState(true)

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

  const [geoError, setGeoError] = useState(false)

  useEffect(() => {
    if ("geolocation" in navigator) {
      const geoOptions = {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000
      }

      const handleSuccess = (pos) => {
        console.log("Posición detectada:", pos.coords)
        setUserPos([pos.coords.latitude, pos.coords.longitude])
        setGeoError(false)
      }

      const handleError = (err) => {
        console.warn("Error de geolocalización:", err.message)
        if (!userPos) {
          setUserPos([10.4806, -66.9036])
          setGeoError(true)
        }
      }

      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions)

      const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, geoOptions)

      return () => navigator.geolocation.clearWatch(watchId)
    } else {
      console.error("Geolocalización no soportada.")
      setUserPos([10.4806, -66.9036])
      setGeoError(true)
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

  useEffect(() => {
    if (nearbyAlert) setShowProximityAlert(true)
  }, [nearbyAlert])

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-[3px] border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
      <span className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Cargando Cartografía</span>
    </div>
  )
  return (
    <>
      {nearbyAlert && showProximityAlert && (
        <div className="fixed bottom-4 right-4 z-2000 pointer-events-auto">
          <div className="bg-rose-600 text-white p-3 rounded-lg shadow-2xl shadow-rose-200 border border-white/20 backdrop-blur-md flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-lg shrink-0">⚠️</div>
            <div className="flex-1">
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-90">Alerta de Proximidad</p>
              <h3 className="text-xs md:text-sm font-bold leading-tight truncate">Estás en una zona de riesgo: {nearbyAlert.tipo_desastre_display}</h3>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button onClick={() => setShowProximityAlert(false)} aria-label="Cerrar alerta" className="text-white/90 hover:text-white text-sm">✕</button>
            </div>
          </div>
        </div>
      )}

      <div className="relative h-[75vh] w-full rounded-[40px] overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/50">

      <div className="absolute bottom-6 left-4 right-4 md:top-6 md:left-6 md:bottom-auto md:right-auto z-30 md:max-w-sm pointer-events-none">
        <div className="glass-panel p-2 md:p-6 rounded-2xl md:rounded-4xl shadow-xl shadow-black/5 animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-top-4 duration-700 pointer-events-auto bg-white/80 backdrop-blur-md">
          <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Mapa de Riesgos</h1>
          <p className="mt-2 text-xs font-semibold text-slate-500 leading-relaxed uppercase tracking-wider hidden sm:block">
            Monitoreo geolocalizado de protocolos activos
          </p>
          <div className="mt-4 md:mt-6 flex flex-wrap items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div>
              <span className="text-[9px] md:text-[10px] font-black uppercase text-slate-400">Zonas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-900 shadow-sm shadow-slate-200"></div>
              <span className="text-[9px] md:text-[10px] font-black uppercase text-slate-400">Eventos</span>
            </div>
            {userPos && (
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setManualCenterTrigger(Date.now())}>
                <div className={`w-2 h-2 rounded-full shadow-sm ${geoError ? 'bg-amber-500 shadow-amber-200' : 'bg-blue-600 shadow-blue-200'}`}></div>
                <span className="text-[9px] md:text-[10px] font-black uppercase text-slate-400">
                  Tu Ubicación {geoError ? '(Aproximada)' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Mensaje si la geolocalización falló */}
          {geoError && (
            <p className="mt-3 text-[9px] text-amber-600 font-medium bg-amber-50 p-2 rounded-lg">
              ⚠️ No se pudo obtener tu ubicación real. Se está mostrando una ubicación por defecto (Caracas).
            </p>
          )}

          {/* BOTÓN CENTRAR EN MÍ */}
          {userPos && (
            <button
              onClick={() => setManualCenterTrigger(Date.now())}
              className="mt-3 md:mt-4 w-full py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition"
            >
              📍 Centrar en mi ubicación
            </button>
          )}

          {/* Suscripción movida abajo (ver sección fuera del mapa) */}

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

        <MapController
          center={defaultCenter}
          zoom={defaultZoom}
          userPos={userPos}
          autoCenter={true}
          trigger={manualCenterTrigger}
        />


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
                  <div className="p-2 min-w-50">
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
      {/* Sección de suscripción debajo del mapa - diseño consistente con la página */}
      <div className="mt-8 w-full max-w-3xl mx-auto">
        <div className="glass-panel p-6 rounded-2xl shadow-xl shadow-black/5 bg-white/90 backdrop-blur-md border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Recibe alertas por correo</h3>
              <p className="mt-1 text-sm text-slate-500">Suscríbete y recibe notificaciones cuando haya alertas en tu zona.</p>
            </div>
          </div>
          <div className="mt-4">
            <SubscribeForm />
          </div>
        </div>
      </div>
    </>
  )
}
