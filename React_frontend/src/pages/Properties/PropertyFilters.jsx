import React from 'react'
import { Search, Building2, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { Input } from '../../components/ui/input'

export default function PropertyFilters({
    searchTerm,
    onSearchChange,
    propertyType,
    onPropertyTypeChange,
    priceRange,
    onPriceRangeChange,
}) {
    return (
        <section className="sticky top-24 z-40 border-b border-slate-200 bg-white py-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Desktop Filters */}
                <div className="hidden gap-3 lg:flex">
                    <div className="relative flex-[2]">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <Input
                            placeholder="Search by property name or location..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="h-12 w-full rounded-xl border-slate-300 bg-white pl-11 pr-4 text-sm shadow-sm transition-all placeholder:text-slate-400 hover:border-[#c99b43]/50 focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                        />
                    </div>

                    <div className="relative flex-1">
                        <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <select
                            value={propertyType}
                            onChange={(e) => onPropertyTypeChange(e.target.value)}
                            className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-11 pr-10 text-sm shadow-sm transition-all hover:border-[#c99b43]/50 focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                            <option value="all">All Types</option>
                            <option value="House">House</option>
                            <option value="Car">Car</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    </div>

                    <div className="relative flex-1">
                        <SlidersHorizontal className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <select
                            value={priceRange}
                            onChange={(e) => onPriceRangeChange(e.target.value)}
                            className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-11 pr-10 text-sm shadow-sm transition-all hover:border-[#c99b43]/50 focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                            <option value="all">All Prices</option>
                            <option value="low">Under 30,000 ETB</option>
                            <option value="mid">30,000 - 50,000 ETB</option>
                            <option value="high">Above 50,000 ETB</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    </div>
                </div>

                {/* Mobile Filters */}
                <div className="space-y-3 lg:hidden">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search properties..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="h-12 w-full rounded-xl border-slate-300 pl-10 pr-4 shadow-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={propertyType}
                                onChange={(e) => onPropertyTypeChange(e.target.value)}
                                className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-10 pr-8 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            >
                                <option value="all">All Types</option>
                                <option value="House">House</option>
                                <option value="Car">Car</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>

                        <div className="relative">
                            <SlidersHorizontal className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={priceRange}
                                onChange={(e) => onPriceRangeChange(e.target.value)}
                                className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-10 pr-8 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            >
                                <option value="all">All Prices</option>
                                <option value="low">&lt; 30K</option>
                                <option value="mid">30K - 50K</option>
                                <option value="high">&gt; 50K</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}