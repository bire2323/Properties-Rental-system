import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from '../components/auth/ProtectedRoute'
import AdminDashboard from '../pages/Admin/AdminDashboard'
import OwnerDashboard from '../pages/Owner/OwnerDashboard'
import OwnerLayout from '../pages/Owner/OwnerLayout'
import OwnerBookings from '../pages/Owner/OwnerBookings'
import OwnerFavorites from '../pages/Owner/OwnerFavorites'
import OwnerMessages from '../pages/Owner/OwnerMessages'
import OwnerPayments from '../pages/Owner/OwnerPayments'
import OwnerProperties from '../pages/Owner/OwnerProperties'
import OwnerReports from '../pages/Owner/OwnerReports'
import OwnerSettings from '../pages/Owner/OwnerSettings'
import AddProperty from '../pages/Owner/AddProperty'
import OwnerPropertyDetails from '../pages/Owner/OwnerPropertyDetails'
import EditProperty from '../pages/Owner/EditProperty'
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

import BecomeOwnerPage from '../pages/RoleChange/BecomeOwnerPage'
import PendingApproval from '@/pages/Owner/PendingApproval'




function AppRoutes() {
    return (
        <>
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/become-owner" element={<BecomeOwnerPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/properties" element={<Properties />} />
                <Route path="/properties/:id" element={<PropertyDetails />} />

                <Route path="/vehicles" element={<Vehicles />} />
                <Route path="/vehicles/:id" element={<VehicleDetails />} />
                <Route path="/owner/pending" element={<PendingApproval />} />

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
                    path="/owner"
                    element={
                        <ProtectedRoute>
                            <OwnerLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<OwnerDashboard />} />
                    <Route path="dashboard" element={<OwnerDashboard />} />
                    <Route path="properties" element={<OwnerProperties />} />
                    <Route path="properties/add" element={<AddProperty />} />
                    <Route path="properties/draft/edit" element={<EditProperty />} />
                    <Route path="properties/:id" element={<OwnerPropertyDetails />} />
                    <Route path="properties/:id/edit" element={<EditProperty />} />
                    <Route path="bookings" element={<OwnerBookings />} />
                    <Route path="favorites" element={<OwnerFavorites />} />
                    <Route path="payments" element={<OwnerPayments />} />
                    <Route path="messages" element={<OwnerMessages />} />
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