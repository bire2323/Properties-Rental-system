
import { useNavigate } from 'react-router-dom'

function TenantDashboard() {
    const navigate = useNavigate()

    const handleBackToHome = () => {
        navigate('/')
    }

    return (
        <button
            type="button"
            onClick={handleBackToHome}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
            <span>←</span>
            Back to Home
        </button>
    )
}

export default TenantDashboard