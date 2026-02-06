import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import AlertList from './pages/AlertList'
import AlertDetail from './pages/AlertDetail'
import Dashboard from './pages/Dashboard'
import AdminAlertList from './pages/admin/AdminAlertList'
import AdminAlertForm from './pages/admin/AdminAlertForm'
import MapPage from './pages/MapPage'
import AdminZoneList from './pages/admin/AdminZoneList'
import AdminZoneForm from './pages/admin/AdminZoneForm'
import Home from './pages/Home'
import { AuthProvider, useAuth } from './context/AuthContext'

const ProtectedRoute = () => {
  const { user } = useAuth()
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          {/* Public or Protected? Let's protect dashboard and admin, leave alerts public but readonly maybe? 
               For now, let's follow the plan: Access control.
           */}
          <Route path="/" element={<Home />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin/alertas" element={<AdminAlertList />} />
            <Route path="/admin/alertas/nueva" element={<AdminAlertForm />} />
            <Route path="/admin/alertas/:id/editar" element={<AdminAlertForm />} />
            <Route path="/admin/zonas" element={<AdminZoneList />} />
            <Route path="/admin/zonas/nueva" element={<AdminZoneForm />} />
            <Route path="/admin/zonas/:id/editar" element={<AdminZoneForm />} />
          </Route>

          {/* Public routes */}
          <Route path="/alertas" element={<AlertList />} />
          <Route path="/alertas/:id" element={<AlertDetail />} />
          <Route path="/mapa" element={<MapPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
