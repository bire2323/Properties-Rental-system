import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from '../components/auth/ProtectedRoute'
import AdminRoute from '../components/auth/AdminRoute'
import AdminDashboard from '../pages/Admin/AdminDashboard'
import Users from '../pages/Admin/Users'
import UserDetail from '../pages/Admin/UserDetail'
import AdminProperties from '../pages/Admin/Properties'
import AdminPropertyDetail from '../pages/Admin/AdminPropertyDetail'
import Rentals from '../pages/Admin/Rentals'
import Verification from '../pages/Admin/Verification'
import VerificationDetail from '../pages/Admin/VerificationDetail'
import Reports from '../pages/Admin/Reports'
import Payments from '../pages/Admin/Payments'
import AdminSetting from '../pages/Admin/AdminSetting'
import AdminProfile from '../pages/Admin/AdminProfile'
import Notification from '../pages/Admin/Notification'
import NotificationDetail from '../pages/Admin/NotificationDetail'
import Locations from '../pages/Admin/Locations'
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
import CreateCompany from '../pages/Owner/Companies/CreateCompany'
import EditCompany from '../pages/Owner/Companies/EditCompany'
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

                <Route path="/owner/companies/create" element={<CreateCompany />} />
                <Route path="/owner/companies/:id/edit" element={<EditCompany />} />

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
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin-dashboard/users"
                    element={
                        <AdminRoute>
                            <Users />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin-dashboard/users/:id"
                    element={
                        <AdminRoute>
                            <UserDetail />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin-dashboard/properties"
                    element={
                        <AdminRoute>
                            <AdminProperties />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin-dashboard/properties/:id"
                    element={
                        <AdminRoute>
                            <AdminPropertyDetail />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin-dashboard/rentals"
                    element={
                        <AdminRoute>
                            <Rentals />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin-dashboard/verification"
                    element={
                        <AdminRoute>
                            <Verification />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin-dashboard/verification/:id"
                    element={
                        <AdminRoute>
                            <VerificationDetail />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin-dashboard/reports"
                    element={
                        <AdminRoute>
                            <Reports />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin-dashboard/payments"
                    element={
                        <AdminRoute>
                            <Payments />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin-dashboard/settings"
                    element={
                        <AdminRoute>
                            <AdminSetting />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin-dashboard/profile"
                    element={
                        <AdminRoute>
                            <AdminProfile />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin-dashboard/notifications"
                    element={
                        <AdminRoute>
                            <Notification />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin-dashboard/notifications/:id"
                    element={
                        <AdminRoute>
                            <NotificationDetail />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/admin-dashboard/locations"
                    element={
                        <AdminRoute>
                            <Locations />
                        </AdminRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    )
}

export default AppRoutes