
import { createContext, useState, useContext, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('token')
        const username = localStorage.getItem('username')
        if (token) {
            setUser({ username })
        }
        setLoading(false)
    }, [])

    const login = async (username, password) => {
        try {
            const response = await api.post('/api-token-auth/', { username, password })
            const { token } = response.data

            localStorage.setItem('token', token)
            localStorage.setItem('username', username)
            setUser({ username })
            return { success: true }
        } catch (error) {
            console.error("Login failed:", error)
            return {
                success: false,
                error: error.response?.data?.non_field_errors?.[0] || 'Error de credenciales'
            }
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        setUser(null)
    }

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Cargando...</div>
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
