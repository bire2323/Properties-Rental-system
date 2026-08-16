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

            <div className="flex-1 bg-white/80 dark:bg-slate-950">
                <OwnerTopbar onToggleSidebar={() => setSidebarOpen(true)} />

                <main className="relative mx-auto min-h-[calc(100vh-80px)] w-full max-w-7xl overflow-hidden px-4 py-6 sm:px-6 lg:px-8">

                    <div className="relative">
                        <OwnerBreadcrumb />
                        <div className="mt-6">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
