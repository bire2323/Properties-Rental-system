import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getDashboardRoute } from '../../services/authService'

export default function GoogleLoginButton() {
    const navigate = useNavigate()
    const { googleLogin } = useAuth()

    const handleSuccess = async (credentialResponse) => {
        try {
            const result = await googleLogin(credentialResponse.credential)
            const route = getDashboardRoute(result?.user?.role)
            navigate(route)
        } catch (error) {
            window.alert(error?.message || 'Google sign-in failed.')
        }
    }

    const handleError = () => {
        window.alert('Google authentication could not be completed.')
    }

    return (
        <div className="w-full">
            <GoogleLogin onSuccess={handleSuccess} onError={handleError} theme="outline" />
        </div>
    )
}
