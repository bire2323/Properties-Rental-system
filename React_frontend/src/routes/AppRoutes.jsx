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

import TenantLayout from '../pages/Tenant/TenantLayout'
import MyBookings from '../pages/Tenant/MyBookings'
import Favorites from '../pages/Tenant/Favorites'
import TenantPayments from '../pages/Tenant/TenantPayments' // create a simple placeholder file if missing
import TenantMessages from '../pages/Tenant/TenantMessages' // placeholder if missing
import Profile from '../pages/Tenant/Profile'
import Settings from '../pages/Tenant/Settings'

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
                    path="/tenant"
                    element={
                        <ProtectedRoute>
                            <TenantLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<TenantDashboard />} />
                    <Route path="dashboard" element={<TenantDashboard />} />
                    <Route path="bookings" element={<MyBookings />} />
                    <Route path="favorites" element={<Favorites />} />
                    <Route path="payments" element={<TenantPayments />} />
                    <Route path="messages" element={<TenantMessages />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                </Route>
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