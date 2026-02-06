import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { zonesApi } from '../../services/api'

export default function AdminZoneList() {
    const [zones, setZones] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const loadZones = () => {
        setLoading(true)
        zonesApi.list()
            .then(res => {
                setZones(res.results || res)
                setError(null)
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }

    useEffect(() => loadZones(), [])

    const handleDelete = (id, nombre) => {
        if (!window.confirm(`¿Confirmar eliminación de la zona "${nombre}"? Esta acción no se puede deshacer.`)) return
        zonesApi.delete(id)
            .then(() => loadZones())
            .catch(err => setError(err.message))
    }

    return (
        <div className="max-w-6xl mx-auto space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="max-w-2xl">
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Zonas de Cobertura</h1>
                    <p className="mt-3 text-slate-500 font-medium leading-relaxed">
                        Defina y gestione las poligonales geográficas protegidas por el sistema.
                        Las alertas solo podrán ser registradas dentro de estos límites.
                    </p>
                </div>

                <Link
                    to="/admin/zonas/nueva"
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-[0.15em] hover:bg-slate-800 transition-bezier shadow-lg shadow-slate-200"
                >
                    + Definir Zona
                </Link>
            </header>

            {error && (
                <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs font-black text-rose-700 uppercase tracking-widest">Error de Sincronización</p>
                    <p className="text-xs text-rose-500 mt-1">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-64 bg-slate-50 rounded-[40px] border border-slate-100 animate-pulse"></div>
                    ))
                ) : zones.map(zone => (
                    <div key={zone.id} className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-bezier relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[80px] -z-10 group-hover:bg-slate-900 transition-colors duration-500"></div>

                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl group-hover:bg-white transition-colors">
                                🗺️
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link
                                    to={`/admin/zonas/${zone.id}/editar`}
                                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl hover:bg-slate-900 hover:text-white transition-bezier shadow-sm"
                                >
                                    ✎
                                </Link>
                                <button
                                    onClick={() => handleDelete(zone.id, zone.nombre)}
                                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl hover:bg-rose-500 hover:text-white transition-bezier shadow-sm"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mb-2 truncate group-hover:text-white transition-colors">{zone.nombre}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 group-hover:text-slate-500 transition-colors">ID: {zone.codigo || zone.id}</p>

                        <div className="flex items-center gap-2 pt-6 border-t border-slate-50 group-hover:border-white/10 transition-colors">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Vértices Geométricos:</span>
                            <span className="text-[9px] font-black text-slate-900 group-hover:text-white">
                                {zone.geometry_geojson?.coordinates?.[0]?.length || 0} PUNTOS
                            </span>
                        </div>
                    </div>
                ))}
                {!loading && zones.length === 0 && (
                    <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-100 rounded-[40px]">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Sin zonas configuradas</p>
                        <Link to="/admin/zonas/nueva" className="mt-4 inline-block text-[10px] font-black text-slate-900 border-b-2 border-slate-900 pb-1">INICIAR CARTOGRAFÍA</Link>
                    </div>
                )}
            </div>
        </div>
    )
}
