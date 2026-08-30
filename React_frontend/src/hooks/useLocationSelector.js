import { useState, useEffect, useCallback } from 'react'
import { getRegions } from '../api/property/propertyApi'

/**
 * useLocationSelector
 *
 * Reusable hook for the centralized Region → City cascading selection logic.
 * Used by:
 *   - AddProperty.jsx / EditProperty.jsx  (form dropdowns)
 *   - PropertySidebarFilters.jsx          (sidebar / bottom-sheet filters)
 *   - VehicleSidebarFilters.jsx           (sidebar / bottom-sheet filters)
 *
 * @param {object} options
 * @param {number|null} options.initialRegionId  - Pre-selected region ID (for edit mode)
 * @param {number|null} options.initialCityId    - Pre-selected city ID (for edit mode)
 *
 * @returns {object}
 *   regions          - Array of all Region objects (with nested cities)
 *   cities           - Cities available for the currently selected region
 *   selectedRegionId - Currently selected region ID (number | null)
 *   selectedCityId   - Currently selected city ID (number | null)
 *   setRegionId      - Setter: call when user picks a region (resets city)
 *   setCityId        - Setter: call when user picks a city
 *   reset            - Clears both selectors
 *   loading          - True while regions are being fetched
 *   error            - Error message string or null
 */
export function useLocationSelector({
    initialRegionId = null,
    initialCityId = null,
} = {}) {
    const [regions, setRegions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [selectedRegionId, setSelectedRegionId] = useState(
        initialRegionId ? Number(initialRegionId) : null
    )
    const [selectedCityId, setSelectedCityId] = useState(
        initialCityId ? Number(initialCityId) : null
    )

    // Fetch regions once on mount
    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError(null)

        getRegions()
            .then((data) => {
                if (!cancelled) setRegions(data)
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || 'Failed to load locations.')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => { cancelled = true }
    }, [])

    // Derived: cities for the selected region
    const cities = selectedRegionId
        ? (regions.find((r) => r.id === selectedRegionId)?.cities ?? [])
        : []

    // When region changes, clear city selection
    const setRegionId = useCallback((regionId) => {
        setSelectedRegionId(regionId ? Number(regionId) : null)
        setSelectedCityId(null)
    }, [])

    const setCityId = useCallback((cityId) => {
        setSelectedCityId(cityId ? Number(cityId) : null)
    }, [])

    const reset = useCallback(() => {
        setSelectedRegionId(null)
        setSelectedCityId(null)
    }, [])

    // Sync initial values when they arrive from parent (edit mode async load)
    useEffect(() => {
        if (initialRegionId != null) setSelectedRegionId(Number(initialRegionId))
    }, [initialRegionId])

    useEffect(() => {
        if (initialCityId != null) setSelectedCityId(Number(initialCityId))
    }, [initialCityId])

    return {
        regions,
        cities,
        selectedRegionId,
        selectedCityId,
        setRegionId,
        setCityId,
        reset,
        loading,
        error,
    }
}
