import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import TenantSidebar from './components/TenantSidebar'
import TenantTopbar from './components/TenantTopbar'
import TenantBreadcrumb from './components/TenantBreadcrumb'
import Footer from '../../components/common/Footer'

export default function TenantLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <div className="flex flex-1 lg:items-stretch">
                <TenantSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <div className="flex-1 bg-white dark:bg-slate-950">
                    <TenantTopbar onToggleSidebar={() => setSidebarOpen(true)} />

                    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        <TenantBreadcrumb />
                        <div className="mt-6 ">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
            <Footer />
        </div>
    )
}
