import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

const Layout = () => {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { path: '/mapa', label: 'Explorar Mapa', icon: '🌍' },
    { path: '/alertas', label: 'Alertas', icon: '🔔' },
  ]

  const adminLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/alertas', label: 'A. Alertas', icon: '⚙️' },
    { path: '/admin/zonas', label: 'A. Zonas', icon: '🗺️' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col text-slate-900 selection:bg-blue-100">
      {/* Navegación Superior */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center group relative z-50">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center mr-3 group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-slate-200">
                <span className="text-xl">⚠️</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black leading-none tracking-tighter">SAT</span>
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-[0.2em] mt-1">Alerta Temprana</span>
              </div>
            </Link>

            {/* Navegación de Escritorio */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-bezier ${isActive(link.path)
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                  {link.label}
                </Link>
              ))}

              {user && (
                <div className="ml-4 pl-4 border-l border-slate-100 flex items-center space-x-1">
                  {adminLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-bezier ${isActive(link.path)
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Acciones de Usuario y Menú Móvil */}
            <div className="flex items-center gap-4 relative z-50">
              <div className="hidden md:flex items-center">
                {user ? (
                  <div className="flex items-center space-x-4">
                    <div className="hidden sm:flex items-center bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{user.username}</span>
                    </div>
                    <button
                      onClick={logout}
                      className="text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
                    >
                      Salir
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-bezier shadow-lg shadow-slate-200/50"
                  >
                    Ingresar
                  </Link>
                )}
              </div>

              {/* Botón de Menú Móvil */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden w-10 h-10 flex flex-col justify-center items-center gap-1.5 focus:outline-none"
              >
                <span className={`h-0.5 w-6 bg-slate-900 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`h-0.5 w-4 bg-slate-900 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'translate-x-1'}`}></span>
                <span className={`h-0.5 w-6 bg-slate-900 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Superposición de Menú Móvil */}
      <div className={`fixed inset-0 bg-white/95 backdrop-blur-xl z-40 transition-all duration-500 md:hidden flex items-center justify-center ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="flex flex-col items-center gap-8 w-full px-6">
          <div className="flex flex-col gap-4 w-full max-w-sm text-center">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Navegación</span>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-2xl font-black text-slate-900 hover:text-blue-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {user && (
            <div className="flex flex-col gap-4 w-full max-w-sm text-center pt-8 border-t border-slate-100">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Administración</span>
              {adminLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xl font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8">
            {user ? (
              <button
                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-100"
              >
                Cerrar Sesión
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-200"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Área de Contenido Principal */}
      <main className="flex-grow">
        <div className="container mx-auto px-6 py-8 md:py-12">
          <Outlet />
        </div>
      </main>

      {/* Pie de Página Minimalista Moderno */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="flex items-center opacity-40">
            <span className="text-xl mr-2">⚠️</span>
            <span className="text-sm font-bold tracking-tight">SAT v2.0 - GeoResponse</span>
          </div>
          <p className="text-slate-400 text-[10px] md:text-sm font-medium">
            Desarrollado para la UNEFA — Defensa Integral e Ingeniería de Sistemas
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-slate-300">
            <a href="#" className="text-[10px] font-black uppercase tracking-widest hover:text-slate-400">Privacidad</a>
            <a href="#" className="text-[10px] font-black uppercase tracking-widest hover:text-slate-400">Protocolos</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
