// src/context/auth-context.jsx (or src/providers/AuthProvider.jsx)
import { useEffect, useMemo, useRef, useState } from 'react'
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
    const sessionTimer = useRef(null)
    const authCheckInFlight = useRef(null)

    function scheduleSessionTimeout(minutes) {
        if (sessionTimer.current) clearTimeout(sessionTimer.current)
        if (!minutes) return
        sessionTimer.current = setTimeout(() => {
            logout()
        }, minutes * 60 * 1000)
    }

    useEffect(() => () => sessionTimer.current && clearTimeout(sessionTimer.current), [])

    // Restore the authenticated user from the HttpOnly cookie-backed profile API.
    async function checkAuth() {
        if (localStorage.getItem('property-rental-auth-session') !== '1') {
            setLoading(false)
            return null
        }

        if (authCheckInFlight.current) return authCheckInFlight.current

        authCheckInFlight.current = (async () => {
            try {
                const profile = await getProfile()
                setUser(profile)
                if (profile?.role === 'admin') scheduleSessionTimeout(profile.session_timeout_minutes)
                return profile
            } catch {
                try {
                    // If the access cookie has expired, try refreshing the session first.
                    await refreshTokenRequest()
                    const profile = await getProfile()
                    setUser(profile)
                    if (profile?.role === 'admin') scheduleSessionTimeout(profile.session_timeout_minutes)
                    return profile
                } catch {
                    setUser(null)
                    return null
                }
            } finally {
                setLoading(false)
                authCheckInFlight.current = null
            }
        })()

        return authCheckInFlight.current
    }

    useEffect(() => {
        checkAuth()
    }, [])

    // ─── ✅ NEW: updateUser function ──────────────────────────────
    const updateUser = (newUserData) => {
        setUser((prevUser) => ({
            ...prevUser,
            ...newUserData,
        }))
    }

    async function register(data) {
        setLoading(true)
        try {
            const result = await registerRequest(data)
            setUser(result.user)
            localStorage.setItem('property-rental-auth-session', '1')
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
            localStorage.setItem('property-rental-auth-session', '1')
            if (result.user?.role === 'admin') scheduleSessionTimeout(result.session_timeout_minutes)
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
            localStorage.removeItem('property-rental-auth-session')
            window.location.assign('/login')
        }
    }

    async function googleLogin(token) {
        setLoading(true)
        try {
            const result = await googleLoginRequest(token)
            setUser(result.user)
            localStorage.setItem('property-rental-auth-session', '1')
            if (result.user?.role === 'admin') scheduleSessionTimeout(result.session_timeout_minutes)
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
            updateUser,
            isAuthenticated: Boolean(user),
        }),
        [user, loading] // updateUser is stable, no need to add to deps
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}