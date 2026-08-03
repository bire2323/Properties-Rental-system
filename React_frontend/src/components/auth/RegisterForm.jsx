import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getDashboardRoute } from '../../services/authService'

export default function RegisterForm() {
    const { register } = useAuth()
    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        confirm_password: '',
        role: 'tenant',
    })
    const [error, setError] = useState('')

    const handleChange = (event) => {
        const { name, value } = event.target
        setFormData((currentState) => ({ ...currentState, [name]: value }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')

        try {
            const result = await register(formData)
            window.location.hash = getDashboardRoute(result?.user?.role)
        } catch (submitError) {
            setError(submitError.message || 'Registration failed.')
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First name" />
            <input name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last name" />
            <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
            <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" />
            <input name="confirm_password" type="password" value={formData.confirm_password} onChange={handleChange} placeholder="Confirm password" />
            {error && <p>{error}</p>}
            <button type="submit">Register</button>
        </form>
    )
}
