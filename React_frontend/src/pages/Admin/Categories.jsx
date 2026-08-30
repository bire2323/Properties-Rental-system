import { useState, useEffect, useCallback, useRef } from 'react'
import {
    FolderTree,
    Plus,
    Pencil,
    Trash2,
    Search,
    X,
    Loader2,
    AlertTriangle,
    Building2,
    Car,
    CheckCircle,
    XCircle,
    ChevronDown,
} from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { useTheme } from '../../hooks/useTheme'
import {
    adminGetCategories,
    adminCreateCategory,
    adminUpdateCategory,
    adminDeleteCategory,
} from '../../api/admin/categoryApi'

// ─── Constants ────────────────────────────────────────────────────────────────

const LISTING_TYPE_OPTIONS = [
    { value: 'house', label: 'Property / House', icon: Building2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { value: 'car', label: 'Vehicle / Car', icon: Car, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
]

function getListingTypeMeta(value) {
    return LISTING_TYPE_OPTIONS.find((o) => o.value === value) || LISTING_TYPE_OPTIONS[0]
}

// ─── Small helpers ────────────────────────────────────────────────────────────

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

function Badge({ active }) {
    return active ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" /> Active
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <XCircle className="h-3 w-3" /> Inactive
        </span>
    )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose() }
        if (open) document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [open, onClose])

    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-700">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    )
}

function ConfirmDeleteModal({ open, onClose, onConfirm, category, loading }) {
    if (!open || !category) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                        <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">Delete Category</h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                    Are you sure you want to permanently delete <strong>"{category.name}"</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onClose} disabled={loading} className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={loading} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />} Delete
                    </button>
                </div>
            </div>
        </div>
    )
}

function FormField({ label, error, required, children }) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {label}{required && <span className="ml-1 text-red-500">*</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
    )
}

const inputCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#255070] focus:outline-none focus:ring-2 focus:ring-[#255070]/20'
const selectCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#255070] focus:outline-none focus:ring-2 focus:ring-[#255070]/20 appearance-none'

// ─── Category Form Modal ──────────────────────────────────────────────────────

function CategoryFormModal({ open, onClose, mode, initialData, onSaved }) {
    const [form, setForm] = useState({ name: '', listing_type: 'house', description: '', is_active: true })
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)
    const [actionError, setActionError] = useState(null)

    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                setForm({
                    name: initialData.name || '',
                    listing_type: initialData.listing_type || 'house',
                    description: initialData.description || '',
                    is_active: initialData.is_active !== false,
                })
            } else {
                setForm({ name: '', listing_type: 'house', description: '', is_active: true })
            }
            setErrors({})
            setActionError(null)
        }
    }, [open, mode, initialData])

    const handleSave = async () => {
        const errs = {}
        if (!form.name.trim()) errs.name = 'Category name is required.'
        if (!form.listing_type) errs.listing_type = 'Please select a listing type.'
        if (Object.keys(errs).length) { setErrors(errs); return }

        setSaving(true)
        setActionError(null)
        try {
            const payload = { name: form.name.trim(), listing_type: form.listing_type, description: form.description.trim() || null, is_active: form.is_active }
            if (mode === 'edit') {
                await adminUpdateCategory(initialData.id, payload)
            } else {
                await adminCreateCategory(payload)
            }
            onSaved()
            onClose()
        } catch (err) {
            setActionError(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal open={open} onClose={onClose} title={mode === 'add' ? 'Add Category' : 'Edit Category'}>
            <FormField label="Category Name" required error={errors.name}>
                <input
                    autoFocus
                    className={`${inputCls} ${errors.name ? 'border-red-500' : ''}`}
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
                    placeholder="e.g. Apartment, Sedan, SUV"
                />
            </FormField>

            <FormField label="Listing Type" required error={errors.listing_type}>
                <div className="relative">
                    <select
                        className={`${selectCls} ${errors.listing_type ? 'border-red-500' : ''} ${mode === 'edit' && initialData?.property_count > 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
                        value={form.listing_type}
                        onChange={(e) => setForm((p) => ({ ...p, listing_type: e.target.value }))}
                        disabled={mode === 'edit' && initialData?.property_count > 0}
                    >
                        {LISTING_TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                {mode === 'edit' && initialData?.property_count > 0 && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                        Listing type cannot be changed because this category is used by {initialData.property_count} listing{initialData.property_count !== 1 ? 's' : ''}.
                    </p>
                )}
            </FormField>

            <FormField label="Description (optional)">
                <textarea
                    className={inputCls}
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description of this category…"
                />
            </FormField>

            <div className="mb-5 flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${form.is_active ? 'bg-[#255070]' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                    {form.is_active ? 'Active — available for new listings' : 'Inactive — hidden from new listings'}
                </span>
            </div>

            {actionError && (
                <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-3 text-sm text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    {actionError}
                </div>
            )}

            <div className="flex justify-end gap-3">
                <button onClick={onClose} className="rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                    Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#255070] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d405d] disabled:opacity-60">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {mode === 'add' ? 'Create Category' : 'Save Changes'}
                </button>
            </div>
        </Modal>
    )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ isDark }) {
    return (
        <div className={`rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'} overflow-hidden`}>
            {[...Array(5)].map((_, i) => (
                <div key={i} className={`flex items-center gap-4 px-4 py-4 border-b last:border-b-0 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                    <div className={`h-9 w-9 rounded-lg animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                    <div className="flex-1 space-y-2">
                        <div className={`h-4 w-32 rounded animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                        <div className={`h-3 w-20 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                    </div>
                    <div className={`h-6 w-16 rounded-full animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                    <div className={`h-6 w-14 rounded animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                </div>
            ))}
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Categories() {
    const { isDark } = useTheme()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Data
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Filters
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState('')
    const [filterActive, setFilterActive] = useState('')
    const searchTimeout = useRef(null)

    // Modals
    const [formModal, setFormModal] = useState({ open: false, mode: 'add', data: null })
    const [deleteModal, setDeleteModal] = useState({ open: false, category: null })
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState(null)

    // Load
    const loadCategories = useCallback(async (opts = {}) => {
        setLoading(true)
        setError(null)
        try {
            const data = await adminGetCategories({
                listingType: opts.listingType ?? filterType,
                isActive: opts.isActive ?? filterActive,
                search: opts.search ?? search,
            })
            setCategories(Array.isArray(data) ? data : data.results || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [filterType, filterActive, search])

    useEffect(() => { loadCategories() }, [filterType, filterActive])

    // Debounced search
    const handleSearchChange = (val) => {
        setSearch(val)
        clearTimeout(searchTimeout.current)
        searchTimeout.current = setTimeout(() => {
            loadCategories({ search: val })
        }, 400)
    }

    // Stats
    const total = categories.length
    const totalActive = categories.filter((c) => c.is_active).length
    const totalHouse = categories.filter((c) => c.listing_type === 'house').length
    const totalCar = categories.filter((c) => c.listing_type === 'car').length

    // Delete
    const handleConfirmDelete = async () => {
        if (!deleteModal.category) return
        setDeleting(true)
        setDeleteError(null)
        try {
            await adminDeleteCategory(deleteModal.category.id)
            setDeleteModal({ open: false, category: null })
            loadCategories()
        } catch (err) {
            setDeleteModal({ open: false, category: null })
            setDeleteError(err.message)
        } finally {
            setDeleting(false)
        }
    }

    const filterBtnCls = (active) =>
        `rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            active
                ? 'bg-[#255070] text-white'
                : isDark
                ? 'text-slate-400 hover:bg-slate-700'
                : 'text-slate-500 hover:bg-slate-100'
        }`

    return (
        <div className={`flex min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex flex-1 flex-col min-w-0">
                <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#255070]">
                                <FolderTree className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Category Management</h1>
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Manage property and vehicle categories used across the platform</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setFormModal({ open: true, mode: 'add', data: null })}
                            className="flex items-center gap-2 rounded-xl bg-[#255070] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d405d] transition"
                        >
                            <Plus className="h-4 w-4" /> Add Category
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatCard icon={FolderTree} label="Total" value={total} color="bg-[#255070]" isDark={isDark} />
                        <StatCard icon={CheckCircle} label="Active" value={totalActive} color="bg-emerald-600" isDark={isDark} />
                        <StatCard icon={Building2} label="Property" value={totalHouse} color="bg-blue-600" isDark={isDark} />
                        <StatCard icon={Car} label="Vehicle" value={totalCar} color="bg-amber-500" isDark={isDark} />
                    </div>

                    {/* Toolbar */}
                    <div className={`rounded-xl border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                        <div className={`flex flex-wrap items-center gap-3 border-b px-4 py-3 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                            {/* Search */}
                            <div className="relative flex-1 min-w-[180px] max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                <input
                                    value={search}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    placeholder="Search categories…"
                                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-[#255070] ${isDark ? 'border-slate-600 bg-slate-800 text-white placeholder:text-slate-500' : 'border-slate-300 bg-slate-50 text-slate-900'}`}
                                />
                            </div>

                            {/* Type filter */}
                            <div className="flex items-center gap-1">
                                <button className={filterBtnCls(filterType === '')} onClick={() => setFilterType('')}>All Types</button>
                                <button className={filterBtnCls(filterType === 'house')} onClick={() => setFilterType(filterType === 'house' ? '' : 'house')}>Property</button>
                                <button className={filterBtnCls(filterType === 'car')} onClick={() => setFilterType(filterType === 'car' ? '' : 'car')}>Vehicle</button>
                            </div>

                            {/* Active filter */}
                            <div className="flex items-center gap-1 ml-auto">
                                <button className={filterBtnCls(filterActive === '')} onClick={() => setFilterActive('')}>All</button>
                                <button className={filterBtnCls(filterActive === 'true')} onClick={() => setFilterActive(filterActive === 'true' ? '' : 'true')}>Active</button>
                                <button className={filterBtnCls(filterActive === 'false')} onClick={() => setFilterActive(filterActive === 'false' ? '' : 'false')}>Inactive</button>
                            </div>
                        </div>

                        {/* List */}
                        {loading ? (
                            <div className="p-4"><Skeleton isDark={isDark} /></div>
                        ) : error ? (
                            <div className="flex flex-col items-center py-16 text-center px-4">
                                <AlertTriangle className={`h-8 w-8 mb-3 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                                <p className={`font-semibold text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>Failed to load categories</p>
                                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{error}</p>
                                <button onClick={() => loadCategories()} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                                    Retry
                                </button>
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="flex flex-col items-center py-16 text-center px-4">
                                <FolderTree className={`h-10 w-10 mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                                <p className={`font-semibold text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {search || filterType || filterActive ? 'No categories match your filters.' : 'No categories yet. Add your first category.'}
                                </p>
                                {!search && !filterType && !filterActive && (
                                    <button onClick={() => setFormModal({ open: true, mode: 'add', data: null })} className="mt-4 flex items-center gap-2 rounded-xl bg-[#255070] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d405d]">
                                        <Plus className="h-4 w-4" /> Add Category
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Desktop table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className={`text-xs font-semibold uppercase tracking-wide border-b ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                                                <th className="px-4 py-3 text-left">Name</th>
                                                <th className="px-4 py-3 text-left">Type</th>
                                                <th className="px-4 py-3 text-left">Description</th>
                                                <th className="px-4 py-3 text-center">Listings</th>
                                                <th className="px-4 py-3 text-center">Status</th>
                                                <th className="px-4 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                                            {categories.map((cat) => {
                                                const meta = getListingTypeMeta(cat.listing_type)
                                                const TypeIcon = meta.icon
                                                return (
                                                    <tr key={cat.id} className={`transition ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                                                        <td className={`px-4 py-3.5 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                            {cat.name}
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.bg} ${meta.color}`}>
                                                                <TypeIcon className="h-3 w-3" />
                                                                {meta.label.split(' /')[0]}
                                                            </span>
                                                        </td>
                                                        <td className={`px-4 py-3.5 max-w-[220px] truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                            {cat.description || <span className="italic opacity-50">—</span>}
                                                        </td>
                                                        <td className={`px-4 py-3.5 text-center text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                                            {cat.property_count ?? 0}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            <Badge active={cat.is_active} />
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    onClick={() => setFormModal({ open: true, mode: 'edit', data: cat })}
                                                                    title="Edit"
                                                                    className={`rounded-lg p-1.5 transition ${isDark ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => { setDeleteError(null); setDeleteModal({ open: true, category: cat }) }}
                                                                    title="Delete"
                                                                    className={`rounded-lg p-1.5 transition ${isDark ? 'text-slate-400 hover:bg-red-900/30 hover:text-red-400' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile cards */}
                                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {categories.map((cat) => {
                                        const meta = getListingTypeMeta(cat.listing_type)
                                        const TypeIcon = meta.icon
                                        return (
                                            <div key={cat.id} className={`px-4 py-4 flex items-start gap-3 ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'} transition`}>
                                                <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
                                                    <TypeIcon className={`h-4 w-4 ${meta.color}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{cat.name}</span>
                                                        <Badge active={cat.is_active} />
                                                    </div>
                                                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {meta.label.split(' /')[0]} · {cat.property_count ?? 0} listing{cat.property_count !== 1 ? 's' : ''}
                                                    </p>
                                                    {cat.description && <p className={`text-xs mt-1 truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{cat.description}</p>}
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => setFormModal({ open: true, mode: 'edit', data: cat })} className={`rounded-lg p-1.5 ${isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-100'}`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => { setDeleteError(null); setDeleteModal({ open: true, category: cat }) }} className={`rounded-lg p-1.5 ${isDark ? 'text-slate-400 hover:bg-red-900/30 hover:text-red-400' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Total count */}
                    {!loading && categories.length > 0 && (
                        <p className={`text-xs text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Showing {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
                        </p>
                    )}
                </main>
            </div>

            {/* Modals */}
            <CategoryFormModal
                open={formModal.open}
                onClose={() => setFormModal({ open: false, mode: 'add', data: null })}
                mode={formModal.mode}
                initialData={formModal.data}
                onSaved={() => loadCategories()}
            />

            <ConfirmDeleteModal
                open={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, category: null })}
                onConfirm={handleConfirmDelete}
                category={deleteModal.category}
                loading={deleting}
            />

            {/* Delete-blocked toast */}
            {deleteError && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-semibold text-white shadow-xl max-w-md w-full mx-4">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <span className="flex-1">{deleteError}</span>
                    <button onClick={() => setDeleteError(null)} className="opacity-70 hover:opacity-100 flex-shrink-0">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    )
}
