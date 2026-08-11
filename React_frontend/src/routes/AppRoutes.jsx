import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from '../components/auth/ProtectedRoute'
import OwnerRoute from '../components/auth/OwnerRoute'
import AdminDashboard from '../pages/Admin/AdminDashboard'
import OwnerLayout from '../pages/Owner/OwnerLayout'
import OwnerDashboard from '../pages/Owner/OwnerDashboard'
import OwnerProperties from '../pages/Owner/OwnerProperties'
import OwnerPropertyDetails from '../pages/Owner/OwnerPropertyDetails'
import AddProperty from '../pages/Owner/AddProperty'
import EditProperty from '../pages/Owner/EditProperty'
import OwnerBookings from '../pages/Owner/OwnerBookings'
import OwnerPayments from '../pages/Owner/OwnerPayments'
import OwnerMessages from '../pages/Owner/OwnerMessages'
import OwnerFavorites from '../pages/Owner/OwnerFavorites'
import OwnerReports from '../pages/Owner/OwnerReports'
import OwnerSettings from '../pages/Owner/OwnerSettings'
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
                    path="/owner"
                    element={
                        <OwnerRoute>
                            <OwnerLayout />
                        </OwnerRoute>
                    }
                >
                    <Route index element={<OwnerDashboard />} />
                    <Route path="dashboard" element={<OwnerDashboard />} />
                    <Route path="properties" element={<OwnerProperties />} />
                    <Route path="properties/add" element={<AddProperty />} />
                    <Route path="properties/:id" element={<OwnerPropertyDetails />} />
                    <Route path="properties/:id/edit" element={<EditProperty />} />
                    <Route path="bookings" element={<OwnerBookings />} />
                    <Route path="payments" element={<OwnerPayments />} />
                    <Route path="messages" element={<OwnerMessages />} />
                    <Route path="favorites" element={<OwnerFavorites />} />
                    <Route path="reports" element={<OwnerReports />} />
                    <Route path="settings" element={<OwnerSettings />} />
                </Route>
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