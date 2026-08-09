import { useEffect, useMemo, useState } from 'react'
import {
    getProfile,
    login as loginRequest,
    logout as logoutRequest,
    register as registerRequest,
    googleLogin as googleLoginRequest,
    refreshToken as refreshTokenRequest,
} from '../api/authApi'
import { normalizeErrorMessage } from '../services/authService'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Restore the authenticated user from the HttpOnly cookie-backed profile API.
    async function checkAuth() {
        try {
            const profile = await getProfile()
            setUser(profile)
            return profile
        } catch {
            try {
                // If the access cookie has expired, try refreshing the session first.
                await refreshTokenRequest()
                const profile = await getProfile()
                setUser(profile)
                return profile
            } catch {
                setUser(null)
                return null
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        checkAuth()
    }, [])

    async function register(data) {
        setLoading(true)
        try {
            const result = await registerRequest(data)
            setUser(result.user)
            return result
        } catch (error) {
            throw new Error(normalizeErrorMessage(error), { cause: error })
        } finally {
            setLoading(false)
        }
    }

    async function login(data) {
        setLoading(true)
        try {
            const result = await loginRequest(data)
            setUser(result.user)
            return result
        } catch (error) {
            throw new Error(normalizeErrorMessage(error), { cause: error })
        } finally {
            setLoading(false)
        }
    }

    async function logout() {
        try {
            await logoutRequest()
        } finally {
            setUser(null)
            window.location.assign('/login')
        }
    }

    async function googleLogin(token) {
        setLoading(true)
        try {
            const result = await googleLoginRequest(token)
            setUser(result.user)
            return result
        } catch (error) {
            throw new Error(normalizeErrorMessage(error), { cause: error })
        } finally {
            setLoading(false)
        }
    }

    const value = useMemo(
        () => ({
            user,
            loading,
            login,
            register,
            logout,
            googleLogin,
            checkAuth,
            isAuthenticated: Boolean(user),
        }),
        [user, loading]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
