import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from '../components/auth/ProtectedRoute'
import AdminDashboard from '../pages/Admin/AdminDashboard'
import OwnerDashboard from '../pages/Owner/OwnerDashboard'
import TenantDashboard from '../pages/Tenant/TenantDashboard'
import Home from '../pages/Home/Home'
import Login from '../pages/Auth/Login'
import Register from '../pages/Auth/Register'
import Properties from '../pages/Properties/Properties'
import PropertyDetails from '../pages/Properties/PropertyDetails'
import Vehicles from '../pages/Vehicles/Vehicles'
import VehicleDetails from '../pages/Vehicles/VehicleDetails'
import ScrollToTop from '../components/common/ScrollToTop'

function AppRoutes() {
    return (
        <>
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/properties" element={<Properties />} />
                <Route path="/properties/:id" element={<PropertyDetails />} />

                <Route path="/vehicles" element={<Vehicles />} />
                <Route path="/vehicles/:id" element={<VehicleDetails />} />

                <Route
                    path="/tenant-dashboard"
                    element={
                        <ProtectedRoute>
                            <TenantDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/owner-dashboard"
                    element={
                        <ProtectedRoute>
                            <OwnerDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin-dashboard"
                    element={
                        <ProtectedRoute>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    )
}

export default AppRoutes