import { Search, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function PropertyToolbar({
    searchTerm,
    onSearchChange,
    propertyType,
    onPropertyTypeChange,
    availability,
    onAvailabilityChange,
    viewMode,
    onViewModeChange,
    onAddProperty,
}) {
    return (
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_220px]">
                <label className="relative block">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <Input
                        value={searchTerm}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Search properties..."
                        className="pl-11"
                    />
                </label>
                <select
                    value={propertyType}
                    onChange={(event) => onPropertyTypeChange(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-700 shadow-sm transition hover:border-[#c99b43]/50 focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                    <option value="all">All types</option>
                    <option value="house">House</option>
                    <option value="car">Car</option>
                </select>
                <select
                    value={availability}
                    onChange={(event) => onAvailabilityChange(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-700 shadow-sm transition hover:border-[#c99b43]/50 focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                    <option value="all">All status</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                </select>
                <Button variant="default" className="h-12 w-full" onClick={onAddProperty}>
                    Add Property
                </Button>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span>{searchTerm ? 'Filtered property list' : 'Showing all owner properties'}</span>
                <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
                    <button
                        type="button"
                        onClick={() => onViewModeChange('grid')}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl transition ${viewMode === 'grid' ? 'bg-[#c99b43] text-white' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                    >
                        <LayoutGrid className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewModeChange('list')}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl transition ${viewMode === 'list' ? 'bg-[#c99b43] text-white' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                    >
                        <List className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
