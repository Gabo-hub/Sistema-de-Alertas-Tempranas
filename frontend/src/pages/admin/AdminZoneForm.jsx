import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { zonesApi } from '../../services/api'

export default function AdminZoneForm() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [form, setForm] = useState({
        nombre: '',
        codigo: '',
        geometry_json: null
    })

    // Campo de texto temporal para el GeoJSON
    const [jsonString, setJsonString] = useState('')

    useEffect(() => {
        if (!isEdit) return
        zonesApi.get(id)
            .then(z => {
                setForm({
                    nombre: z.nombre,
                    codigo: z.codigo || '',
                    geometry_json: z.geometry_geojson
                })
                setJsonString(JSON.stringify(z.geometry_geojson, null, 2))
            })
            .catch(err => setError(err.message))
    }, [id, isEdit])

    const handleSubmit = (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        let finalPolygon = null
        try {
            if (jsonString.trim()) {
                const parsed = JSON.parse(jsonString)

                // Función auxiliar para extraer el polígono
                const extractPolygon = (obj) => {
                    if (obj.type === 'Polygon') return obj
                    if (obj.type === 'Feature') return extractPolygon(obj.geometry)
                    if (obj.type === 'FeatureCollection' && obj.features?.length > 0) {
                        return extractPolygon(obj.features[0])
                    }
                    return null
                }

                finalPolygon = extractPolygon(parsed)

                if (!finalPolygon) {
                    throw new Error('No se encontró una geometría de tipo "Polygon" en el GeoJSON proporcionado.')
                }
            }
        } catch (err) {
            setError(`GeoJSON inválido: ${err.message}`)
            setLoading(false)
            return
        }

        const payload = {
            ...form,
            geometry_json: finalPolygon
        }

        const req = isEdit ? zonesApi.update(id, payload) : zonesApi.create(payload)
        req
            .then(() => navigate('/admin/zonas'))
            .catch((err) => {
                const msg = err.response?.data?.non_field_errors?.[0] ||
                    err.response?.data?.detail ||
                    err.message
                setError(msg)
            })
            .finally(() => setLoading(false))
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <Link to="/admin/zonas" className="group inline-flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors">
                <span className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-bezier">←</span>
                Regresar a Zonas
            </Link>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
                <header className="px-10 py-12 md:px-16 border-b border-slate-50">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">{isEdit ? 'Editar Poligonal' : 'Definir Nueva Zona'}</h1>
                    <p className="mt-2 text-slate-500 font-medium">Configure los límites geográficos en formato GeoJSON para el control de alertas regionales.</p>
                </header>

                <form onSubmit={handleSubmit} className="p-10 md:p-16 space-y-10">
                    {error && (
                        <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 animate-in fade-in slide-in-from-top-2">
                            <p className="text-xs font-black text-rose-700 uppercase tracking-widest">Error de Validación</p>
                            <p className="text-xs text-rose-400 mt-1">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Zona</label>
                            <input
                                type="text"
                                required
                                value={form.nombre}
                                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                                className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                placeholder="Ej: Sector Norte - Maracay"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código Identificador (Opcional)</label>
                            <input
                                type="text"
                                value={form.codigo}
                                onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                                className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                placeholder="Ej: SN-001"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end ml-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Geometría GeoJSON (Polygon)</label>
                            <a
                                href="https://geojson.io"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[9px] font-black text-blue-600 underline uppercase tracking-tighter"
                            >
                                Dibujar en geojson.io →
                            </a>
                        </div>
                        <textarea
                            required
                            rows={12}
                            value={jsonString}
                            onChange={e => setJsonString(e.target.value)}
                            className="w-full p-8 rounded-[32px] bg-slate-900 text-emerald-400 font-mono text-xs border-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none shadow-inner"
                            placeholder='{ "type": "Polygon", "coordinates": [...] }'
                        />
                        <p className="text-[9px] font-medium text-slate-400 ml-1">
                            * El sistema validará automáticamente que las alertas de esta zona no salgan de estos límites.
                        </p>
                    </div>

                    <div className="pt-6 border-t border-slate-50 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-bezier shadow-xl shadow-slate-200 ${loading ? 'opacity-50 cursor-wait' : ''}`}
                        >
                            {loading ? 'Sincronizando...' : (isEdit ? 'Actualizar Cartografía' : 'Guardar Zona')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
