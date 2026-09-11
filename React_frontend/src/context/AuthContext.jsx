// src/context/auth-context.jsx (or src/providers/AuthProvider.jsx)
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    getProfile,
    login as loginRequest,
    loginOtpVerify as loginOtpVerifyRequest,
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
    const sessionTimeoutMinutes = useRef(null)
    const authCheckInFlight = useRef(null)
    const logoutRef = useRef(logout)

    useEffect(() => {
        logoutRef.current = logout
    })

    const scheduleSessionTimeout = useCallback((minutes) => {
        sessionTimeoutMinutes.current = minutes
        if (sessionTimer.current) clearTimeout(sessionTimer.current)
        if (!minutes) return
        sessionTimer.current = setTimeout(() => {
            logoutRef.current()
        }, minutes * 60 * 1000)
    }, [])

    // Sliding idle timeout: any user activity resets the countdown, so the
    // session only ends after `session_timeout_minutes` without interaction.
    useEffect(() => {
        const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'mousemove', 'touchstart', 'scroll', 'wheel']
        function resetIdleTimer() {
            scheduleSessionTimeout(sessionTimeoutMinutes.current)
        }
        ACTIVITY_EVENTS.forEach((eventName) => {
            window.addEventListener(eventName, resetIdleTimer, { passive: true })
        })
        return () => {
            ACTIVITY_EVENTS.forEach((eventName) => {
                window.removeEventListener(eventName, resetIdleTimer)
            })
            if (sessionTimer.current) clearTimeout(sessionTimer.current)
        }
    }, [scheduleSessionTimeout])

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
                if (profile?.session_timeout_minutes) scheduleSessionTimeout(profile.session_timeout_minutes)
                return profile
            } catch {
                try {
                    // If the access cookie has expired, try refreshing the session first.
                    await refreshTokenRequest()
                    const profile = await getProfile()
                    setUser(profile)
                    if (profile?.session_timeout_minutes) scheduleSessionTimeout(profile.session_timeout_minutes)
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
            // Manual login now requires a two-step email-OTP flow. The step-1
            // response carries a challenge (no user yet), which the login page
            // completes via verifyLoginOtp before we establish a session.
            if (result?.requires_otp) {
                return result
            }
            setUser(result.user)
            localStorage.setItem('property-rental-auth-session', '1')
            if (result.session_timeout_minutes) scheduleSessionTimeout(result.session_timeout_minutes)
            return result
        } catch (error) {
            throw new Error(normalizeErrorMessage(error), { cause: error })
        } finally {
            setLoading(false)
        }
    }

    async function verifyLoginOtp(loginChallengeId, code) {
        setLoading(true)
        try {
            const result = await loginOtpVerifyRequest(loginChallengeId, code)
            setUser(result.user)
            localStorage.setItem('property-rental-auth-session', '1')
            if (result.session_timeout_minutes) scheduleSessionTimeout(result.session_timeout_minutes)
            return result
        } catch (error) {
            throw new Error(normalizeErrorMessage(error), { cause: error })
        } finally {
            setLoading(false)
        }
    }

    async function logout() {
        if (sessionTimer.current) clearTimeout(sessionTimer.current)
        sessionTimeoutMinutes.current = null
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
            if (result.session_timeout_minutes) scheduleSessionTimeout(result.session_timeout_minutes)
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
            verifyLoginOtp,
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