import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { PriceRangeSlider } from './PriceRangeSlider';
import { getCategories, getFeatures } from '../../api/property/propertyApi';
import { useLocationSelector } from '../../hooks/useLocationSelector';

const selectCls = 'w-full h-9 appearance-none rounded-xl border border-slate-200 bg-slate-50/80 pl-2.5 pr-7 text-[13px] font-medium transition-all duration-200 hover:border-[#c99b43]/50 focus:border-[#c99b43] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-white dark:hover:border-slate-600 dark:focus:border-[#c99b43] dark:focus:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'

function FilterSection({ title, children }) {
  return (
    <div className="space-y-2.5">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function PropertySidebarFilters({ filters, setFilters, onClearAll, onFilterSelect, className = '' }) {
  const [availableFeatures, setAvailableFeatures] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const triggerFilterSelect = () => {
    if (onFilterSelect) {
      setTimeout(() => {
        onFilterSelect();
      }, 180);
    }
  };

  const {
    regions,
    cities,
    selectedRegionId,
    selectedCityId,
    setRegionId,
    setCityId,
    reset: resetLocation,
    loading: locLoading,
  } = useLocationSelector({
    initialRegionId: filters.region_id || null,
    initialCityId: filters.city_id || null,
  });

  // Sync location hook → filters when external reset happens (onClearAll)
  useEffect(() => {
    if (!filters.region_id && !filters.city_id) {
      resetLocation();
    }
  }, [filters.region_id, filters.city_id]);

  useEffect(() => {
    let mounted = true;
    getFeatures()
      .then((data) => { if (mounted && Array.isArray(data)) setAvailableFeatures(data); })
      .catch(() => { });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    getCategories('house')
      .then((data) => { if (mounted) setCategories(Array.isArray(data) ? data : data.results || []); })
      .catch(() => { });
    return () => { mounted = false; };
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== 'search') {
      triggerFilterSelect();
    }
  };

  const handleRegionChange = (e) => {
    const id = e.target.value ? Number(e.target.value) : null;
    setRegionId(id);
    setFilters((prev) => ({ ...prev, region_id: id || '', city_id: '' }));
    triggerFilterSelect();
  };

  const handleCityChange = (e) => {
    const id = e.target.value ? Number(e.target.value) : null;
    setCityId(id);
    setFilters((prev) => ({ ...prev, city_id: id || '' }));
    triggerFilterSelect();
  };

  const toggleFeature = (featureId) => {
    setFilters((prev) => {
      const cur = prev.features || [];
      return {
        ...prev,
        features: cur.includes(featureId)
          ? cur.filter((id) => id !== featureId)
          : [...cur, featureId],
      };
    });
    triggerFilterSelect();
  };

  const PillButton = ({ active, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 ${active
        ? 'bg-[#c99b43] text-white shadow-sm shadow-[#c99b43]/25'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-700'
        }`}
    >
      {children}
    </button>
  );

  const displayedFeatures = showAllFeatures ? availableFeatures : availableFeatures.slice(0, 6);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Filters</h2>
        <button
          onClick={() => {
            onClearAll?.();
            triggerFilterSelect();
          }}
          className="rounded-lg px-2 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-[#c99b43] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-[#f3c96d] transition-colors duration-200"
        >
          Clear All
        </button>
      </div>

      <FilterSection title="Search">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full h-9 pl-8 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 focus:bg-white dark:focus:bg-slate-800 transition-colors"
          />
        </div>
      </FilterSection>
      {/* Location — cascading Region → City */}
      <FilterSection title="Location">
        <div className="space-y-2">
          {/* Region */}
          <div className="relative">
            <select
              value={selectedRegionId ?? ''}
              onChange={handleRegionChange}
              disabled={locLoading}
              className={selectCls}
            >
              <option value="">{locLoading ? 'Loading…' : 'All Regions'}</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          {/* City — only shown once a region is picked */}
          {selectedRegionId && cities.length > 0 && (
            <div className="relative">
              <select
                value={selectedCityId ?? ''}
                onChange={handleCityChange}
                className={selectCls}
              >
                <option value="">All Cities in Region</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          )}
        </div>
      </FilterSection>

      <FilterSection title="Category">
        <div className="relative">
          <select value={filters.category || ''} onChange={(e) => handleFilterChange('category', e.target.value)} className={selectCls}>
            <option value="">All Categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>
      </FilterSection>

      <FilterSection title="Price Range">
        <div className="pt-1">
          <PriceRangeSlider
            value={[filters.min_price || 0, filters.max_price || 200000]}
            onValueChange={(val) => {
              setFilters((prev) => ({ ...prev, min_price: val[0], max_price: val[1] }));
              triggerFilterSelect();
            }}
          />
        </div>
      </FilterSection>

      {(!filters.type || filters.type === 'house' || filters.type === 'all') && (
        <FilterSection title="Bedrooms">
<div className="flex flex-wrap gap-1.5">
              {['any', '1', '2', '3', '4', '5'].map((val) => (
              <PillButton
                key={`bed-${val}`}
                active={(filters.bedrooms || 'any') === val}
                onClick={() => handleFilterChange('bedrooms', val === 'any' ? '' : val)}
              >
                {val === 'any' ? 'Any' : `${val}+`}
              </PillButton>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Availability">
        <div className="flex flex-wrap gap-1.5">
          <PillButton active={!filters.is_available} onClick={() => handleFilterChange('is_available', '')}>All</PillButton>
          <PillButton active={filters.is_available === 'true'} onClick={() => handleFilterChange('is_available', 'true')}>Available Only</PillButton>
          <PillButton active={filters.is_available === 'false'} onClick={() => handleFilterChange('is_available', 'false')}>Rented Only</PillButton>
        </div>
      </FilterSection>

      {availableFeatures.length > 0 && (
        <FilterSection title="Features">
          <div className="flex flex-wrap gap-1.5">
            {displayedFeatures.map((feature) => {
              const isActive = (filters.features || []).includes(feature.id);
              return (
                <button
                  key={feature.id}
                  onClick={() => toggleFeature(feature.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all duration-200 ${isActive
                    ? 'bg-[#c99b43]/10 border-[#c99b43] text-[#c99b43] shadow-sm shadow-[#c99b43]/10'
                    : 'bg-transparent border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600'
                    }`}
                >
                  {feature.name}
                </button>
              );
            })}
          </div>
          {availableFeatures.length > 6 && (
            <button
              onClick={() => setShowAllFeatures(!showAllFeatures)}
              className="flex items-center gap-1 mt-2 text-xs font-semibold text-[#c99b43] hover:text-[#b08838] transition-colors"
            >
              {showAllFeatures ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Show more</>}
            </button>
          )}
        </FilterSection>
      )}
    </div>
  );
}
