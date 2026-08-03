import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getDashboardRoute } from '../../services/authService'

export default function LoginForm() {
    const { login } = useAuth()
    const [formData, setFormData] = useState({ email: '', password: '' })
    const [error, setError] = useState('')

    const handleChange = (event) => {
        const { name, value } = event.target
        setFormData((currentState) => ({ ...currentState, [name]: value }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')

        try {
            const result = await login(formData)
            window.location.hash = getDashboardRoute(result?.user?.role)
        } catch (submitError) {
            setError(submitError.message || 'Login failed.')
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
            <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" />
            {error && <p>{error}</p>}
            <button type="submit">Login</button>
        </form>
    )
}
