import { useState, useEffect, useCallback } from 'react'
import {
    MapPinned,
    Plus,
    Pencil,
    Trash2,
    Search,
    ChevronDown,
    ChevronRight,
    X,
    Loader2,
    AlertTriangle,
    Building2,
    Globe,
} from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { useTheme } from '../../hooks/useTheme'
import {
    adminGetRegions,
    adminCreateRegion,
    adminUpdateRegion,
    adminDeleteRegion,
    adminGetCities,
    adminCreateCity,
    adminUpdateCity,
    adminDeleteCity,
} from '../../api/admin/locationApi'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, isDark }) {
    return (
        <div className={`rounded-xl border p-5 flex items-center gap-4 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
                <p className={`mt-0.5 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
            </div>
        </div>
    )
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }) {
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose() }
        if (open) document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [open, onClose])
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-700">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    )
}

// ─── Confirm Delete Dialog ────────────────────────────────────────────────────

function ConfirmDeleteModal({ open, onClose, onConfirm, title, description, loading, error }) {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                        <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{description}</p>
                {error && (
                    <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Form Field ───────────────────────────────────────────────────────────────

function FormField({ label, error, children }) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
    )
}

const inputCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#255070] focus:outline-none focus:ring-2 focus:ring-[#255070]/20'
const selectCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#255070] focus:outline-none focus:ring-2 focus:ring-[#255070]/20 appearance-none'

function mapFieldErrors(payload, fields) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {}

    return fields.reduce((acc, field) => {
        const value = payload[field]
        if (Array.isArray(value) && value.length > 0) {
            acc[field] = value[0]
        } else if (typeof value === 'string' && value) {
            acc[field] = value
        }
        return acc
    }, {})
}

// ─── Region Row ───────────────────────────────────────────────────────────────

function RegionRow({ region, isDark, onEdit, onDelete, onExpand, expanded, cities, citiesLoading, onEditCity, onDeleteCity, onAddCity }) {
    return (
        <div className={`rounded-xl border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'} overflow-hidden`}>
            {/* Region header */}
            <div className={`flex items-center gap-3 px-4 py-3.5 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'} transition`}>
                <button
                    onClick={() => onExpand(region.id)}
                    className={`flex items-center justify-center h-7 w-7 rounded-lg ${isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                <Globe className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />

                <div className="flex-1 min-w-0">
                    <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{region.name}</span>
                    <span className={`ml-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {region.city_count} {region.city_count === 1 ? 'city' : 'cities'}
                        {region.property_count > 0 && ` · ${region.property_count} properties`}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onAddCity(region)}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${isDark ? 'text-emerald-400 hover:bg-emerald-900/30' : 'text-emerald-700 hover:bg-emerald-50'}`}
                        title="Add city to this region"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        City
                    </button>
                    <button
                        onClick={() => onEdit(region)}
                        className={`rounded-lg p-1.5 transition ${isDark ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                        title="Edit region"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={() => onDelete(region)}
                        className={`rounded-lg p-1.5 transition ${isDark ? 'text-slate-400 hover:bg-red-900/30 hover:text-red-400' : 'text-slate-500 hover:bg-red-50 hover:text-red-600'}`}
                        title="Delete region"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Expanded cities */}
            {expanded && (
                <div className={`border-t ${isDark ? 'border-slate-700 bg-slate-950/30' : 'border-slate-100 bg-slate-50'}`}>
                    {citiesLoading ? (
                        <div className="flex items-center gap-2 px-10 py-4 text-sm text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading cities…
                        </div>
                    ) : cities.length === 0 ? (
                        <p className="px-10 py-4 text-sm text-slate-400 italic">No cities in this region yet.</p>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {cities.map((city) => (
                                <div key={city.id} className={`flex items-center gap-3 pl-10 pr-4 py-2.5 ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-white'} transition`}>
                                    <Building2 className={`h-3.5 w-3.5 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                    <span className={`flex-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{city.name}</span>
                                    {(city.property_count > 0 || city.company_count > 0) && (
                                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {[
                                                city.property_count > 0 && `${city.property_count} prop.`,
                                                city.company_count > 0 && `${city.company_count} co.`,
                                            ].filter(Boolean).join(' · ')}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => onEditCity(city, region)}
                                            className={`rounded-lg p-1.5 transition ${isDark ? 'text-slate-500 hover:bg-slate-700 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => onDeleteCity(city)}
                                            className={`rounded-lg p-1.5 transition ${isDark ? 'text-slate-500 hover:bg-red-900/30 hover:text-red-400' : 'text-slate-400 hover:bg-red-50 hover:text-red-500'}`}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Locations() {
    const { isDark } = useTheme()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Data
    const [regions, setRegions] = useState([])
    const [citiesMap, setCitiesMap] = useState({}) // { regionId: city[] }
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Expand state
    const [expandedRegions, setExpandedRegions] = useState({})
    const [loadingCitiesFor, setLoadingCitiesFor] = useState({})

    // Search
    const [regionSearch, setRegionSearch] = useState('')

    // Modals
    const [regionModal, setRegionModal] = useState({ open: false, mode: 'add', region: null })
    const [cityModal, setCityModal] = useState({ open: false, mode: 'add', city: null, defaultRegion: null })
    const [deleteModal, setDeleteModal] = useState({ open: false, type: null, item: null })

    // Form state
    const [regionForm, setRegionForm] = useState({ name: '' })
    const [cityForm, setCityForm] = useState({ name: '', region: '' })
    const [formErrors, setFormErrors] = useState({})
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [actionError, setActionError] = useState(null)

    // Load
    const loadRegions = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await adminGetRegions()
            setRegions(Array.isArray(data) ? data : data.results || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadRegions() }, [loadRegions])

    const loadCitiesForRegion = async (regionId) => {
        if (citiesMap[regionId]) return
        setLoadingCitiesFor((prev) => ({ ...prev, [regionId]: true }))
        try {
            const data = await adminGetCities(regionId)
            setCitiesMap((prev) => ({ ...prev, [regionId]: Array.isArray(data) ? data : data.results || [] }))
        } catch {
            setCitiesMap((prev) => ({ ...prev, [regionId]: [] }))
        } finally {
            setLoadingCitiesFor((prev) => ({ ...prev, [regionId]: false }))
        }
    }

    const handleExpand = (regionId) => {
        setExpandedRegions((prev) => {
            const next = { ...prev, [regionId]: !prev[regionId] }
            if (next[regionId]) loadCitiesForRegion(regionId)
            return next
        })
    }

    // Stats
    const totalRegions = regions.length
    const totalCities = regions.reduce((s, r) => s + (r.city_count || 0), 0)
    const totalUsed = regions.reduce((s, r) => s + (r.property_count || 0) + (r.company_count || 0), 0)

    // Filtered
    const filteredRegions = regions.filter((r) =>
        r.name.toLowerCase().includes(regionSearch.toLowerCase())
    )

    // ── Region modal ──────────────────────────────────────────────────────────

    const openAddRegion = () => {
        setRegionForm({ name: '' })
        setFormErrors({})
        setActionError(null)
        setRegionModal({ open: true, mode: 'add', region: null })
    }

    const openEditRegion = (region) => {
        setRegionForm({ name: region.name })
        setFormErrors({})
        setActionError(null)
        setRegionModal({ open: true, mode: 'edit', region })
    }

    const closeRegionModal = () => {
        setFormErrors({})
        setActionError(null)
        setRegionModal({ open: false, mode: 'add', region: null })
    }

    const handleSaveRegion = async () => {
        const name = regionForm.name.trim()
        if (!name) {
            setFormErrors({ name: 'Region name is required.' })
            return
        }
        setSaving(true)
        setActionError(null)
        setFormErrors({})
        try {
            if (regionModal.mode === 'add') {
                await adminCreateRegion({ name })
            } else {
                await adminUpdateRegion(regionModal.region.id, { name })
            }
            closeRegionModal()
            // Invalidate cities cache for this region
            if (regionModal.region) {
                setCitiesMap((prev) => { const next = { ...prev }; delete next[regionModal.region.id]; return next })
            }
            await loadRegions()
        } catch (err) {
            setFormErrors(mapFieldErrors(err.payload, ['name']))
            setActionError(err.message)
        } finally {
            setSaving(false)
        }
    }

    // ── City modal ────────────────────────────────────────────────────────────

    const openAddCity = (region) => {
        setCityForm({ name: '', region: region?.id || '' })
        setFormErrors({})
        setActionError(null)
        setCityModal({ open: true, mode: 'add', city: null, defaultRegion: region })
    }

    const openEditCity = (city, region) => {
        setCityForm({ name: city.name, region: city.region || region?.id || '' })
        setFormErrors({})
        setActionError(null)
        setCityModal({ open: true, mode: 'edit', city, defaultRegion: region })
    }

    const closeCityModal = () => {
        setFormErrors({})
        setActionError(null)
        setCityModal({ open: false, mode: 'add', city: null, defaultRegion: null })
    }

    const handleSaveCity = async () => {
        const name = cityForm.name.trim()
        const regionId = cityForm.region
        const errors = {}
        if (!name) errors.name = 'City name is required.'
        if (!regionId) errors.region = 'Please select a region.'
        if (Object.keys(errors).length) { setFormErrors(errors); return }
        setSaving(true)
        setActionError(null)
        setFormErrors({})
        try {
            if (cityModal.mode === 'add') {
                await adminCreateCity({ name, region: regionId })
            } else {
                await adminUpdateCity(cityModal.city.id, { name, region: regionId })
            }
            closeCityModal()
            // Invalidate cities cache for affected regions
            const oldRegionId = cityModal.city?.region_id || cityModal.defaultRegion?.id
            setCitiesMap((prev) => {
                const next = { ...prev }
                if (oldRegionId) delete next[oldRegionId]
                if (regionId && regionId !== oldRegionId) delete next[regionId]
                return next
            })
            await loadRegions()
            // Reload cities for currently expanded regions
            const toReload = [oldRegionId, regionId].filter(Boolean)
            toReload.forEach((rid) => {
                if (expandedRegions[rid]) loadCitiesForRegion(rid)
            })
        } catch (err) {
            setFormErrors(mapFieldErrors(err.payload, ['name', 'region']))
            setActionError(err.message)
        } finally {
            setSaving(false)
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    const openDeleteRegion = (region) => {
        setActionError(null)
        setDeleteModal({ open: true, type: 'region', item: region })
    }

    const openDeleteCity = (city) => {
        setActionError(null)
        setDeleteModal({ open: true, type: 'city', item: city })
    }

    const closeDeleteModal = () => {
        setActionError(null)
        setDeleteModal({ open: false, type: null, item: null })
    }

    const handleConfirmDelete = async () => {
        if (!deleteModal.item) return
        setDeleting(true)
        setActionError(null)
        try {
            if (deleteModal.type === 'region') {
                await adminDeleteRegion(deleteModal.item.id)
                setCitiesMap((prev) => { const next = { ...prev }; delete next[deleteModal.item.id]; return next })
            } else {
                await adminDeleteCity(deleteModal.item.id)
                const rid = deleteModal.item.region_id || deleteModal.item.region
                setCitiesMap((prev) => { const next = { ...prev }; delete next[rid]; return next })
                if (rid && expandedRegions[rid]) loadCitiesForRegion(rid)
            }
            closeDeleteModal()
            await loadRegions()
        } catch (err) {
            setActionError(err.message)
        } finally {
            setDeleting(false)
        }
    }

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className={`flex min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex flex-1 flex-col min-w-0">
                <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
                    {/* Page header */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#255070]">
                                <MapPinned className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Location Management</h1>
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Manage Regions and Cities used across the platform</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => openAddCity(null)}
                                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                            >
                                <Plus className="h-4 w-4" /> Add City
                            </button>
                            <button
                                onClick={openAddRegion}
                                className="flex items-center gap-2 rounded-xl bg-[#255070] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d405d] transition"
                            >
                                <Plus className="h-4 w-4" /> Add Region
                            </button>
                        </div>
                    </div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard icon={Globe} label="Total Regions" value={totalRegions} color="bg-[#255070]" isDark={isDark} />
                        <StatCard icon={Building2} label="Total Cities" value={totalCities} color="bg-emerald-600" isDark={isDark} />
                        <StatCard icon={MapPinned} label="Linked to Listings" value={totalUsed} color="bg-amber-500" isDark={isDark} />
                    </div>

                    {/* Main content */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    ) : error ? (
                        <div className={`rounded-xl border p-6 text-center ${isDark ? 'border-red-800/40 bg-red-900/20 text-red-400' : 'border-red-200 bg-red-50 text-red-600'}`}>
                            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                            <p className="font-semibold">Failed to load locations</p>
                            <p className="text-sm mt-1">{error}</p>
                            <button onClick={loadRegions} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div className={`rounded-xl border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                            {/* Toolbar */}
                            <div className={`flex items-center gap-3 border-b px-4 py-3 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                <div className="relative flex-1 max-w-xs">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    <input
                                        value={regionSearch}
                                        onChange={(e) => setRegionSearch(e.target.value)}
                                        placeholder="Search regions…"
                                        className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm ${isDark ? 'border-slate-600 bg-slate-800 text-white placeholder:text-slate-500' : 'border-slate-300 bg-slate-50 text-slate-900'} focus:outline-none focus:border-[#255070]`}
                                    />
                                </div>
                                <p className={`ml-auto text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {filteredRegions.length} region{filteredRegions.length !== 1 ? 's' : ''}
                                </p>
                            </div>

                            {/* Region list */}
                            <div className="p-4 space-y-3">
                                {filteredRegions.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <MapPinned className={`h-10 w-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                                        <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {regionSearch ? 'No regions match your search.' : 'No regions yet. Add your first region.'}
                                        </p>
                                    </div>
                                ) : (
                                    filteredRegions.map((region) => (
                                        <RegionRow
                                            key={region.id}
                                            region={region}
                                            isDark={isDark}
                                            onEdit={openEditRegion}
                                            onDelete={openDeleteRegion}
                                            onExpand={handleExpand}
                                            expanded={!!expandedRegions[region.id]}
                                            cities={citiesMap[region.id] || []}
                                            citiesLoading={!!loadingCitiesFor[region.id]}
                                            onEditCity={openEditCity}
                                            onDeleteCity={openDeleteCity}
                                            onAddCity={openAddCity}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* ── Add/Edit Region Modal ─────────────────────────────────────── */}
            <Modal
                open={regionModal.open}
                onClose={closeRegionModal}
                title={regionModal.mode === 'add' ? 'Add Region' : 'Edit Region'}
            >
                <FormField label="Region Name" error={formErrors.name}>
                    <input
                        className={`${inputCls} ${formErrors.name ? 'border-red-500' : ''}`}
                        value={regionForm.name}
                        onChange={(e) => setRegionForm({ name: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRegion() }}
                        placeholder="e.g. Amhara"
                        autoFocus
                    />
                </FormField>
                {actionError && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-3 text-sm text-red-700 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        {actionError}
                    </div>
                )}
                <div className="flex justify-end gap-3">
                    <button onClick={closeRegionModal} className={`rounded-xl border px-4 py-2 text-sm font-medium ${isDark ? 'border-slate-600 text-slate-300' : 'border-slate-200 text-slate-700'}`}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveRegion}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-xl bg-[#255070] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d405d] disabled:opacity-60"
                    >
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {regionModal.mode === 'add' ? 'Create Region' : 'Save Changes'}
                    </button>
                </div>
            </Modal>

            {/* ── Add/Edit City Modal ───────────────────────────────────────── */}
            <Modal
                open={cityModal.open}
                onClose={closeCityModal}
                title={cityModal.mode === 'add' ? 'Add City' : 'Edit City'}
            >
                <FormField label="City Name" error={formErrors.name}>
                    <input
                        className={`${inputCls} ${formErrors.name ? 'border-red-500' : ''}`}
                        value={cityForm.name}
                        onChange={(e) => setCityForm((p) => ({ ...p, name: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCity() }}
                        placeholder="e.g. Bahir Dar"
                        autoFocus
                    />
                </FormField>
                <FormField label="Region" error={formErrors.region}>
                    <div className="relative">
                        <select
                            className={`${selectCls} ${formErrors.region ? 'border-red-500' : ''}`}
                            value={cityForm.region}
                            onChange={(e) => setCityForm((p) => ({ ...p, region: e.target.value ? Number(e.target.value) : '' }))}
                        >
                            <option value="">— Select a Region —</option>
                            {regions.map((r) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                </FormField>
                {actionError && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-3 text-sm text-red-700 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        {actionError}
                    </div>
                )}
                <div className="flex justify-end gap-3">
                    <button onClick={closeCityModal} className={`rounded-xl border px-4 py-2 text-sm font-medium ${isDark ? 'border-slate-600 text-slate-300' : 'border-slate-200 text-slate-700'}`}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveCity}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-xl bg-[#255070] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d405d] disabled:opacity-60"
                    >
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {cityModal.mode === 'add' ? 'Create City' : 'Save Changes'}
                    </button>
                </div>
            </Modal>

            {/* ── Delete Confirmation ───────────────────────────────────────── */}
            <ConfirmDeleteModal
                open={deleteModal.open}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                loading={deleting}
                error={actionError}
                title={`Delete ${deleteModal.type === 'region' ? 'Region' : 'City'}`}
                description={
                    deleteModal.type === 'region'
                        ? `Are you sure you want to delete the region "${deleteModal.item?.name}"? This action cannot be undone.`
                        : `Are you sure you want to delete the city "${deleteModal.item?.name}"? This action cannot be undone.`
                }
            />

            {/* Delete error (shown below the modal if delete was blocked) */}
            {!deleteModal.open && actionError && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-semibold text-white shadow-xl max-w-md">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <span>{actionError}</span>
                    <button onClick={() => setActionError(null)} className="ml-2 opacity-70 hover:opacity-100">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    )
}
