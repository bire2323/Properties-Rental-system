import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../hooks/useAuth'
import { getDashboardRoute } from '../../services/authService'

export default function GoogleLoginButton() {
    const { googleLogin } = useAuth()

    // The Google credential is sent to Django, which verifies it and returns the profile.
    const handleSuccess = async (credentialResponse) => {
        try {
            const result = await googleLogin(credentialResponse.credential)
            const route = getDashboardRoute(result?.user?.role)
            window.location.hash = route
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
