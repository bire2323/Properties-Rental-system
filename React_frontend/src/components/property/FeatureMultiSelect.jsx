import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { getFeatures } from '../../api/property/propertyApi'

/**
 * Searchable multi-select for property features/amenities.
 *
 * @param {Object} props
 * @param {Array<{id: number, name: string}>} [props.selectedFeatures]
 * @param {(features: Array<{id: number, name: string}>) => void} props.onChange
 * @param {Array<{id: number, name: string}>} [props.features] - Pre-loaded features (optional)
 * @param {boolean} [props.disabled]
 */
export default function FeatureMultiSelect({
  selectedFeatures = [],
  onChange,
  features: externalFeatures,
  disabled = false,
}) {
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [availableFeatures, setAvailableFeatures] = useState(externalFeatures || [])
  const [loading, setLoading] = useState(!externalFeatures)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (externalFeatures) {
      setAvailableFeatures(externalFeatures)
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadFeatures() {
      setLoading(true)
      setError(null)
      try {
        const data = await getFeatures()
        if (!cancelled) {
          setAvailableFeatures(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load features.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadFeatures()
    return () => {
      cancelled = true
    }
  }, [externalFeatures])

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedIds = useMemo(
    () => new Set(selectedFeatures.map((feature) => feature.id)),
    [selectedFeatures]
  )

  const filteredFeatures = useMemo(() => {
    const query = search.trim().toLowerCase()
    return availableFeatures.filter((feature) => {
      if (selectedIds.has(feature.id)) return false
      if (!query) return true
      return feature.name.toLowerCase().includes(query)
    })
  }, [availableFeatures, search, selectedIds])

  const handleSelect = (feature) => {
    onChange([...selectedFeatures, feature])
    setSearch('')
    inputRef.current?.focus()
  }

  const handleRemove = (featureId) => {
    onChange(selectedFeatures.filter((feature) => feature.id !== featureId))
  }

  return (
    <div ref={containerRef} className="space-y-2">
      {selectedFeatures.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedFeatures.map((feature) => (
            <span
              key={feature.id}
              className="inline-flex items-center gap-2 rounded-full border border-[#c99b43]/30 bg-[#fff7e8] px-3 py-1.5 text-sm font-medium text-slate-800 dark:border-[#c99b43]/30 dark:bg-[#1e1a11] dark:text-slate-100"
            >
              {feature.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(feature.id)}
                  className="rounded-full p-0.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
                  aria-label={`Remove ${feature.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <div
          className={`flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 shadow-sm transition focus-within:border-[#c99b43] focus-within:ring-2 focus-within:ring-[#c99b43]/20 dark:bg-slate-900 ${
            disabled
              ? 'cursor-not-allowed border-slate-200 opacity-60 dark:border-slate-700'
              : 'cursor-text border-slate-300 dark:border-slate-700'
          }`}
          onClick={() => {
            if (!disabled) {
              setOpen(true)
              inputRef.current?.focus()
            }
          }}
        >
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            disabled={disabled || loading}
            onChange={(event) => {
              setSearch(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder={
              loading
                ? 'Loading features...'
                : selectedFeatures.length
                  ? 'Search features...'
                  : 'Select property features...'
            }
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        </div>

        {open && !disabled && !loading && (
          <div className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            {error ? (
              <p className="px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : filteredFeatures.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                {availableFeatures.length === 0
                  ? 'No features available.'
                  : 'No matching features.'}
              </p>
            ) : (
              filteredFeatures.map((feature) => (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => handleSelect(feature)}
                  className="flex w-full items-center px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {feature.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {error && !open && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
