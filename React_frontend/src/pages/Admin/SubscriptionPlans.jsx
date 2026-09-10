import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
    BadgeDollarSign,
    Plus,
    Pencil,
    Search,
    X,
    Loader2,
    AlertTriangle,
    UserRound,
    Building2,
    CheckCircle,
    XCircle,
    ChevronDown,
    Power,
    RefreshCcw,
    Clock,
    Percent,
    Layers,
    Star,
} from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { useTheme } from '../../hooks/useTheme'
import { toast } from '../../components/ui/toaster'
import {
    adminGetSubscriptionPlans,
    adminCreateSubscriptionPlan,
    adminUpdateSubscriptionPlan,
    adminSetSubscriptionPlanActive,
} from '../../api/admin/subscriptionPlanApi'
import { formatAmount } from '../../lib/bookingDisplay'

// ─── Constants ────────────────────────────────────────────────────────────────

const TARGET_OPTIONS = [
    { value: 'individual', label: 'Individual', icon: UserRound },
    { value: 'company', label: 'Company', icon: Building2 },
]

const CYCLE_OPTIONS = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
]

const CURRENCY_OPTIONS = [
    { value: 'ETB', label: 'ETB — Ethiopian Birr' },
    { value: 'USD', label: 'USD — US Dollar' },
]

function getTargetMeta(value) {
    return TARGET_OPTIONS.find((o) => o.value === value) || TARGET_OPTIONS[0]
}

function getCycleLabel(value) {
    return (CYCLE_OPTIONS.find((o) => o.value === value) || { label: capitalize(value) }).label
}

function capitalize(value) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : '—'
}

function formatLimit(value) {
    return value == null ? 'Unlimited' : `${value}`
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

function Badge({ active, isDark }) {
    return active ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" /> Active
        </span>
    ) : (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
            <XCircle className="h-3 w-3" /> Inactive
        </span>
    )
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children, size }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose() }
        if (open) document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [open, onClose])

    if (!open) return null
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative z-10 w-full ${size === 'lg' ? 'max-w-2xl' : 'max-w-md'} rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-700 max-h-[90vh] overflow-y-auto`}>
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-6 py-4">
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

function ConfirmToggleModal({ open, onClose, onConfirm, plan, activating, loading }) {
    if (!open || !plan) return null
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${activating ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                        {activating ? <RefreshCcw className={`h-5 w-5 ${activating ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} /> : <Power className="h-5 w-5 text-red-600 dark:text-red-400" />}
                    </div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        {activating ? 'Activate Plan' : 'Deactivate Plan'}
                    </h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                    {activating ? (
                        <>Make <strong>"{plan.name}"</strong> available for new purchases. No existing subscriptions are affected.</>
                    ) : (
                        <>Deactivate <strong>"{plan.name}"</strong>? New owners will no longer be able to select it. Existing subscribers keep their current terms and remain valid until their period ends.</>
                    )}
                </p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onClose} disabled={loading} className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50">
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${activating ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {activating ? 'Activate' : 'Deactivate'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function FormField({ label, error, required, hint, children }) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {label}{required && <span className="ml-1 text-red-500">*</span>}
            </label>
            {children}
            {hint && !error && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
            {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
    )
}

const inputCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#255070] focus:outline-none focus:ring-2 focus:ring-[#255070]/20'
const selectCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#255070] focus:outline-none focus:ring-2 focus:ring-[#255070]/20 appearance-none'

// ─── Plan Form Modal ──────────────────────────────────────────────────────────

function PlanFormModal({ open, onClose, mode, initialData, onSaved }) {
    const [form, setForm] = useState({
        name: '',
        description: '',
        target_type: 'individual',
        price: '',
        currency: 'ETB',
        billing_cycle: 'monthly',
        max_listings: '',
        featured_listing_limit: '',
        commission_rate_discount: '0',
        is_active: true,
    })
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)
    const [actionError, setActionError] = useState(null)

    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                setForm({
                    name: initialData.name || '',
                    description: initialData.description || '',
                    target_type: initialData.target_type || 'individual',
                    price: initialData.price != null ? String(initialData.price) : '',
                    currency: initialData.currency || 'ETB',
                    billing_cycle: initialData.billing_cycle || 'monthly',
                    max_listings: initialData.max_listings != null ? String(initialData.max_listings) : '',
                    featured_listing_limit: initialData.featured_listing_limit != null ? String(initialData.featured_listing_limit) : '',
                    commission_rate_discount: initialData.commission_rate_discount != null ? String(initialData.commission_rate_discount) : '0',
                    is_active: initialData.is_active !== false,
                })
            } else {
                setForm({
                    name: '',
                    description: '',
                    target_type: 'individual',
                    price: '',
                    currency: 'ETB',
                    billing_cycle: 'monthly',
                    max_listings: '',
                    featured_listing_limit: '',
                    commission_rate_discount: '0',
                    is_active: true,
                })
            }
            setErrors({})
            setActionError(null)
        }
    }, [open, mode, initialData])

    const handleSave = async () => {
        const errs = {}
        if (!form.name.trim()) errs.name = 'Plan name is required.'
        if (!form.target_type) errs.target_type = 'Select a target type.'
        if (form.price === '' || form.price == null) errs.price = 'Price is required.'
        else if (Number(form.price) < 0) errs.price = 'Price cannot be negative.'
        if (!form.currency) errs.currency = 'Select a currency.'
        if (!form.billing_cycle) errs.billing_cycle = 'Select a billing cycle.'
        if (form.max_listings !== '' && Number(form.max_listings) < 0) errs.max_listings = 'Cannot be negative.'
        if (form.featured_listing_limit !== '' && Number(form.featured_listing_limit) < 0) errs.featured_listing_limit = 'Cannot be negative.'
        if (Number(form.commission_rate_discount) < 0 || Number(form.commission_rate_discount) > 100) errs.commission_rate_discount = 'Must be between 0 and 100.'

        if (Object.keys(errs).length) { setErrors(errs); return }

        setSaving(true)
        setActionError(null)
        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim() || null,
                target_type: form.target_type,
                price: form.price,
                currency: form.currency,
                billing_cycle: form.billing_cycle,
                max_listings: form.max_listings === '' ? null : Number(form.max_listings),
                featured_listing_limit: form.featured_listing_limit === '' ? null : Number(form.featured_listing_limit),
                commission_rate_discount: form.commission_rate_discount === '' ? '0' : form.commission_rate_discount,
                is_active: form.is_active,
            }
            if (mode === 'edit') {
                await adminUpdateSubscriptionPlan(initialData.id, payload)
                toast.success(`Plan "${payload.name}" updated.`)
            } else {
                await adminCreateSubscriptionPlan(payload)
                toast.success(`Plan "${payload.name}" created.`)
            }
            onSaved()
            onClose()
        } catch (err) {
            setActionError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const numberInput = (key) => ({
        type: 'number',
        min: '0',
        className: `${inputCls} ${errors[key] ? 'border-red-500' : ''}`,
        value: form[key],
        onChange: (e) => setForm((p) => ({ ...p, [key]: e.target.value })),
    })

    return (
        <Modal open={open} onClose={onClose} title={mode === 'add' ? 'Create Subscription Plan' : 'Edit Subscription Plan'} size="lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <FormField label="Plan Name" required error={errors.name}>
                    <input
                        autoFocus
                        className={`${inputCls} ${errors.name ? 'border-red-500' : ''}`}
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
                        placeholder="e.g. Premium"
                    />
                </FormField>

                <FormField label="Target Type" required error={errors.target_type}>
                    <div className="relative">
                        <select
                            className={selectCls}
                            value={form.target_type}
                            onChange={(e) => setForm((p) => ({ ...p, target_type: e.target.value }))}
                        >
                            {TARGET_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                </FormField>

                <div className="sm:col-span-2">
                    <FormField label="Description">
                        <textarea
                            className={inputCls}
                            rows={2}
                            value={form.description}
                            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Short description of what this plan offers…"
                        />
                    </FormField>
                </div>

                <FormField label="Price" required error={errors.price}>
                    <input {...numberInput('price')} placeholder="e.g. 1000" />
                </FormField>

                <FormField label="Currency" required error={errors.currency}>
                    <div className="relative">
                        <select
                            className={selectCls}
                            value={form.currency}
                            onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                        >
                            {CURRENCY_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                </FormField>

                <FormField label="Billing Cycle" required error={errors.billing_cycle}>
                    <div className="relative">
                        <select
                            className={selectCls}
                            value={form.billing_cycle}
                            onChange={(e) => setForm((p) => ({ ...p, billing_cycle: e.target.value }))}
                        >
                            {CYCLE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                </FormField>

                <FormField label="Maximum Listings" error={errors.max_listings} hint="Leave empty for unlimited.">
                    <input {...numberInput('max_listings')} placeholder="e.g. 20 (empty = unlimited)" />
                </FormField>

                <FormField label="Featured Listing Limit" error={errors.featured_listing_limit} hint="Leave empty for unlimited.">
                    <input {...numberInput('featured_listing_limit')} placeholder="e.g. 5 (empty = unlimited)" />
                </FormField>

                <div className="sm:col-span-2">
                    <FormField label="Commission Rate Discount (%)" error={errors.commission_rate_discount} hint="Percentage discount off the standard platform commission (0–100).">
                        <input {...numberInput('commission_rate_discount')} placeholder="e.g. 20" />
                    </FormField>
                </div>
            </div>

            <div className="mb-5 flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${form.is_active ? 'bg-[#255070]' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                    {form.is_active ? 'Active — available for new purchases' : 'Inactive — hidden from new purchases'}
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
                    {mode === 'add' ? 'Create Plan' : 'Save Changes'}
                </button>
            </div>
        </Modal>
    )
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, isDark, onEdit, onToggle }) {
    const target = getTargetMeta(plan.target_type)
    const TargetIcon = target.icon
    const isPopular = Number(plan.commission_rate_discount) >= 20

    const featureRows = [
        { icon: Layers, label: 'Listings', value: formatLimit(plan.max_listings) },
        { icon: Star, label: 'Featured listings', value: formatLimit(plan.featured_listing_limit) },
        { icon: Percent, label: 'Commission discount', value: `${Number(plan.commission_rate_discount) || 0}%` },
    ]

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`relative overflow-hidden rounded-2xl border p-5 flex flex-col ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'} shadow-sm`}
        >
            {isPopular && (
                <div className="absolute right-0 top-0 rounded-bl-2xl bg-gradient-to-r from-[#c99b43] to-[#e8bb6a] px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                    ★ Popular
                </div>
            )}

            <div className="flex items-center justify-between pr-14">
                <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                    <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                        <TargetIcon className="h-3 w-3" />
                        {target.label}
                    </span>
                </div>
            </div>

            <p className={`mt-3 text-sm font-semibold ${isDark ? 'text-[#f3c96d]' : 'text-[#b98227]'}`}>
                {formatAmount(plan.price, plan.currency)}{' '}
                <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    / {getCycleLabel(plan.billing_cycle)}
                </span>
            </p>

            {plan.description && (
                <p className={`mt-2 text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {plan.description}
                </p>
            )}

            <div className={`mt-4 space-y-2 rounded-xl border p-3 text-sm ${isDark ? 'border-slate-700/60 bg-slate-800/40' : 'border-slate-100 bg-slate-50'}`}>
                {featureRows.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                        <span className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </span>
                        <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{value}</span>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
                <Badge active={plan.is_active} isDark={isDark} />
                <div className="flex items-center gap-2">
                    {plan.is_active ? (
                        <button
                            onClick={() => onToggle(plan, false)}
                            title="Deactivate"
                            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${isDark ? 'text-red-400 hover:bg-red-950/40' : 'text-red-600 hover:bg-red-50'}`}
                        >
                            <Power className="h-3.5 w-3.5" /> Deactivate
                        </button>
                    ) : (
                        <button
                            onClick={() => onToggle(plan, true)}
                            title="Activate"
                            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${isDark ? 'text-emerald-400 hover:bg-emerald-950/40' : 'text-emerald-600 hover:bg-emerald-50'}`}
                        >
                            <RefreshCcw className="h-3.5 w-3.5" /> Activate
                        </button>
                    )}
                    <button
                        onClick={() => onEdit(plan)}
                        title="Edit"
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ isDark }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
                <div key={i} className={`rounded-2xl border p-5 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                    <div className={`h-5 w-28 animate-pulse rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                    <div className={`mt-3 h-4 w-20 animate-pulse rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                    <div className={`mt-4 space-y-2`}>
                        {[...Array(3)].map((_, j) => (
                            <div key={j} className={`h-3 w-full animate-pulse rounded ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SubscriptionPlans() {
    const { isDark } = useTheme()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const [plans, setPlans] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [search, setSearch] = useState('')
    const [filterTarget, setFilterTarget] = useState('')
    const [filterActive, setFilterActive] = useState('')
    const searchTimeout = useRef(null)

    const [formModal, setFormModal] = useState({ open: false, mode: 'add', data: null })
    const [toggleModal, setToggleModal] = useState({ open: false, plan: null, activating: false })
    const [toggling, setToggling] = useState(false)

    const loadPlans = useCallback(async (opts = {}) => {
        setLoading(true)
        setError(null)
        try {
            const data = await adminGetSubscriptionPlans({
                search: opts.search ?? search,
                targetType: opts.targetType ?? filterTarget,
                isActive: opts.isActive ?? filterActive,
            })
            setPlans(Array.isArray(data) ? data : data.results || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [search, filterTarget, filterActive])

    useEffect(() => { loadPlans() }, [filterTarget, filterActive])

    const handleSearchChange = (val) => {
        setSearch(val)
        clearTimeout(searchTimeout.current)
        searchTimeout.current = setTimeout(() => {
            loadPlans({ search: val })
        }, 400)
    }

    const total = plans.length
    const totalActive = plans.filter((p) => p.is_active).length
    const totalInactive = total - totalActive
    const totalCompany = plans.filter((p) => p.target_type === 'company').length
    const totalIndividual = plans.filter((p) => p.target_type === 'individual').length

    const handleToggle = async () => {
        const { plan, activating } = toggleModal
        if (!plan) return
        setToggling(true)
        try {
            await adminSetSubscriptionPlanActive(plan.id, activating)
            if (activating) {
                toast.success(`Plan "${plan.name}" is now active.`)
            } else {
                toast.warning(`Plan "${plan.name}" deactivated. Existing subscribers are unaffected.`)
            }
            setToggleModal({ open: false, plan: null, activating: false })
            loadPlans()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setToggling(false)
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
                <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#255070]">
                                <BadgeDollarSign className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Subscription Plans</h1>
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Manage the plans available to GETSPACE owners
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setFormModal({ open: true, mode: 'add', data: null })}
                            className="flex items-center gap-2 rounded-xl bg-[#255070] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d405d] transition"
                        >
                            <Plus className="h-4 w-4" /> Create Plan
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatCard icon={BadgeDollarSign} label="Total Plans" value={total} color="bg-[#255070]" isDark={isDark} />
                        <StatCard icon={CheckCircle} label="Active" value={totalActive} color="bg-emerald-600" isDark={isDark} />
                        <StatCard icon={UserRound} label="Individual" value={totalIndividual} color="bg-blue-600" isDark={isDark} />
                        <StatCard icon={Building2} label="Company" value={totalCompany} color="bg-amber-500" isDark={isDark} />
                    </div>

                    {/* Toolbar */}
                    <div className={`rounded-xl border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                        <div className={`flex flex-wrap items-center gap-3 border-b px-4 py-3 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                            <div className="relative flex-1 min-w-[180px] max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                <input
                                    value={search}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    placeholder="Search plans…"
                                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-[#255070] ${isDark ? 'border-slate-600 bg-slate-800 text-white placeholder:text-slate-500' : 'border-slate-300 bg-slate-50 text-slate-900'}`}
                                />
                            </div>

                            <div className="flex items-center gap-1">
                                <button className={filterBtnCls(filterTarget === '')} onClick={() => setFilterTarget('')}>All Targets</button>
                                <button className={filterBtnCls(filterTarget === 'individual')} onClick={() => setFilterTarget(filterTarget === 'individual' ? '' : 'individual')}>Individual</button>
                                <button className={filterBtnCls(filterTarget === 'company')} onClick={() => setFilterTarget(filterTarget === 'company' ? '' : 'company')}>Company</button>
                            </div>

                            <div className="flex items-center gap-1 ml-auto">
                                <button className={filterBtnCls(filterActive === '')} onClick={() => setFilterActive('')}>All</button>
                                <button className={filterBtnCls(filterActive === 'true')} onClick={() => setFilterActive(filterActive === 'true' ? '' : 'true')}>Active</button>
                                <button className={filterBtnCls(filterActive === 'false')} onClick={() => setFilterActive(filterActive === 'false' ? '' : 'false')}>Inactive</button>
                            </div>
                        </div>

                        {/* Content */}
                        {loading ? (
                            <div className="p-4"><Skeleton isDark={isDark} /></div>
                        ) : error ? (
                            <div className="flex flex-col items-center py-16 text-center px-4">
                                <AlertTriangle className={`h-8 w-8 mb-3 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                                <p className={`font-semibold text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>Failed to load subscription plans</p>
                                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{error}</p>
                                <button onClick={() => loadPlans()} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                                    Retry
                                </button>
                            </div>
                        ) : plans.length === 0 ? (
                            <div className="flex flex-col items-center py-16 text-center px-4">
                                <BadgeDollarSign className={`h-10 w-10 mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                                <p className={`font-semibold text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {search || filterTarget || filterActive ? 'No plans match your filters.' : 'No subscription plans yet. Create your first plan.'}
                                </p>
                                {!search && !filterTarget && !filterActive && (
                                    <button onClick={() => setFormModal({ open: true, mode: 'add', data: null })} className="mt-4 flex items-center gap-2 rounded-xl bg-[#255070] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d405d]">
                                        <Plus className="h-4 w-4" /> Create Plan
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {plans.map((plan) => (
                                    <PlanCard
                                        key={plan.id}
                                        plan={plan}
                                        isDark={isDark}
                                        onEdit={(p) => setFormModal({ open: true, mode: 'edit', data: p })}
                                        onToggle={(p, activating) => setToggleModal({ open: true, plan: p, activating })}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Help box */}
                    <div className={`flex items-start gap-3 rounded-xl border p-4 text-xs leading-relaxed ${isDark ? 'border-slate-700 bg-slate-900 text-slate-400' : 'border-slate-200 bg-white text-slate-500'}`}>
                        <Clock className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-[#f3c96d]' : 'text-[#b98227]'}`} />
                        <p>
                            <span className="font-semibold">Note:</span> Deactivating a plan only stops new purchases.
                            Owners with an active subscription keep the terms they purchased (price, listings, commission discount)
                            until their period ends — their subscription history is never changed.
                        </p>
                    </div>
                </main>
            </div>

            <PlanFormModal
                open={formModal.open}
                onClose={() => setFormModal({ open: false, mode: 'add', data: null })}
                mode={formModal.mode}
                initialData={formModal.data}
                onSaved={() => loadPlans()}
            />

            <ConfirmToggleModal
                open={toggleModal.open}
                onClose={() => setToggleModal({ open: false, plan: null, activating: false })}
                onConfirm={handleToggle}
                plan={toggleModal.plan}
                activating={toggleModal.activating}
                loading={toggling}
            />
        </div>
    )
}