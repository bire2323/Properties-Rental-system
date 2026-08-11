import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import OwnerSidebar from './components/OwnerSidebar'
import OwnerTopbar from './components/OwnerTopbar'
import OwnerBreadcrumb from './components/OwnerBreadcrumb'

export default function OwnerLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:flex">
            <OwnerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 bg-slate-50 dark:bg-slate-950">
                <OwnerTopbar onToggleSidebar={() => setSidebarOpen(true)} />

                <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <OwnerBreadcrumb />
                    <div className="mt-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
