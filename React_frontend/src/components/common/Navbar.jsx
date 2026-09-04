import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getDashboardRoute } from '@/services/authService'
import { getImageUrl } from '@/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Building2,
  Car,
  ChevronDown,
  ChevronRight,
  Heart,
  Home as HomeIcon,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Search,
  Settings,
  Star,
  SunMedium,
  User,
  X,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { getSiteSettings, resolveSiteMediaUrl } from '../../api/siteSettingsApi'
import { getPublicCategories } from '@/api/admin/categoryApi'

const navItems = [
  { label: 'Home', path: '/', hasDropdown: false },
  { label: 'Properties', path: '/properties', hasDropdown: false },
  { label: 'Vehicles', path: '/vehicles', hasDropdown: false },
  { label: 'About Us', path: '/about', hasDropdown: false },
]

function BrandSkeleton() {
  return (
    <>
      <div className="h-14 w-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-2">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-20 animate-pulse rounded bg-slate-200/80 dark:bg-slate-800/80" />
      </div>
    </>
  )
}

function BrandFallback({ isDark, label = 'Home' }) {
  return (
    <>
      <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#c99b43]/25 bg-[#c99b43]/10 text-[#b98227] dark:border-[#c99b43]/35 dark:bg-white/5 dark:text-[#f3c96d]">
        <Building2 size={26} />
      </span>
      <span className={`text-lg font-semibold tracking-tight ${isDark ? 'text-[#f3c96d]' : 'text-[#0b2141]'}`}>
        {label}
      </span>
    </>
  )
}

function DropdownSkeletonRows({ count = 5 }) {
  return Array.from({ length: count }).map((_, index) => (
    <div
      key={`dropdown-skeleton-${index}`}
      className="rounded-lg px-4 py-2.5"
    >
      <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
    </div>
  ))
}

function DropdownStatusRow({ message }) {
  return (
    <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
      {message}
    </div>
  )
}

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const prefersReducedMotion = useReducedMotion()
  const { user, logout, loading } = useAuth()
  const [siteSettings, setSiteSettings] = useState(null)
  const [siteSettingsStatus, setSiteSettingsStatus] = useState('loading')
  const [listingOptions, setListingOptions] = useState({
    property_categories: [],
    vehicle_categories: [],
  })
  const [listingOptionsStatus, setListingOptionsStatus] = useState('loading')
  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false)
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false)
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobilePropertyOpen, setMobilePropertyOpen] = useState(false)
  const [mobileVehicleOpen, setMobileVehicleOpen] = useState(false)
  const [brandLogoFailed, setBrandLogoFailed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const propertyDropdownRef = useRef(null)
  const vehicleDropdownRef = useRef(null)
  const authDropdownRef = useRef(null)

  const profileLabel = user?.first_name
  const profileImageUrl = user?.profile_image ? getImageUrl(user.profile_image) : null
  const navigateTo = (path) => {
    setMobileMenuOpen(false)
    navigate(path)
  }
  const userLabel = user?.first_name || user?.email?.split('@')[0] || 'User'
  const userInitial = userLabel.charAt(0).toUpperCase()
  const siteName = siteSettings?.site_name?.trim() || ''
  const siteLogoUrl = resolveSiteMediaUrl(siteSettings?.logo)
  const propertyCategories = Array.isArray(listingOptions?.property_categories)
    ? listingOptions.property_categories
    : []
  const vehicleCategories = Array.isArray(listingOptions?.vehicle_categories)
    ? listingOptions.vehicle_categories
    : []

  useEffect(() => {
    let isActive = true

    setSiteSettingsStatus('loading')
    getSiteSettings()
      .then((data) => {
        if (!isActive) return
        setSiteSettings(data)
        setSiteSettingsStatus('success')
      })
      .catch(() => {
        if (!isActive) return
        setSiteSettingsStatus('error')
      })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    let isActive = true

    setListingOptionsStatus('loading')

    const fetchCategories = async () => {
      try {
        const [propertyData, vehicleData] = await Promise.all([
          getPublicCategories('house'),
          getPublicCategories('car'),
        ])

        if (!isActive) return

        const transformCategories = (data) => {
          return Array.isArray(data)
            ? data.map((item) => ({
              value: item.name,
              label: item.name.charAt(0).toUpperCase() + item.name.slice(1),
              listing_type: item.listing_type,
            }))
            : []
        }

        setListingOptions({
          property_categories: transformCategories(propertyData),
          vehicle_categories: transformCategories(vehicleData),
        })
        setListingOptionsStatus('success')
      } catch (error) {
        if (!isActive) return
        setListingOptionsStatus('error')
      }
    }

    fetchCategories()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        propertyDropdownRef.current &&
        !propertyDropdownRef.current.contains(event.target)
      ) {
        setPropertyDropdownOpen(false)
      }

      if (
        vehicleDropdownRef.current &&
        !vehicleDropdownRef.current.contains(event.target)
      ) {
        setVehicleDropdownOpen(false)
      }

      if (
        authDropdownRef.current &&
        !authDropdownRef.current.contains(event.target)
      ) {
        setAuthDropdownOpen(false)
      }
    }

    if (propertyDropdownOpen || vehicleDropdownOpen || authDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [propertyDropdownOpen, vehicleDropdownOpen, authDropdownOpen])

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false)
    setMobilePropertyOpen(false)
    setMobileVehicleOpen(false)
  }, [location.pathname, location.search])

  // Close mobile menu on Escape
  useEffect(() => {
    if (!mobileMenuOpen) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileMenuOpen])

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (!mobileMenuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    setBrandLogoFailed(false)
  }, [siteSettings?.logo])

  const handlePropertyTypeClick = (value) => {
    setPropertyDropdownOpen(false)
    setMobileMenuOpen(false)
    if (value) {
      navigateTo(`/properties?type=${value}`)
    } else {
      navigateTo('/properties')
    }
  }

  const handleVehicleTypeClick = (value) => {
    setVehicleDropdownOpen(false)
    setMobileMenuOpen(false)
    if (value) {
      navigateTo(`/vehicles?type=${value}`)
    } else {
      navigateTo('/vehicles')
    }
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const query = searchQuery.trim()
    navigateTo(`/properties${query ? `?search=${encodeURIComponent(query)}` : ''}`)
  }

  const handleLogout = async () => {
    setAuthDropdownOpen(false)
    setMobileMenuOpen(false)
    await logout()
  }

  const isNavActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#c99b43]/25 bg-white/90 text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-[#c99b43]/35 dark:bg-[linear-gradient(90deg,#03172f_0%,#04254a_55%,#03172f_100%)] dark:text-white dark:shadow-[0_18px_50px_rgba(3,12,26,0.35)]">
        <div className="relative mx-auto flex max-w-screen-2xl lg:mx-10 flex-col px-4 sm:px-6 lg:px-8">
          {/* ─── Top row ─────────────────────────────────────────────── */}
          <div className="relative flex min-h-20 items-center justify-between">
            {/* Left: mobile menu + logo */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-[#c99b43]/10 lg:hidden dark:text-slate-100 dark:hover:bg-white/10"
                aria-label="Open navigation menu"
                aria-haspopup="dialog"
                aria-controls="mobile-nav-drawer"
                aria-expanded={mobileMenuOpen}
              >
                <Menu size={20} />
              </button>
              <button type="button" onClick={() => navigateTo('/')} className="flex shrink-0 items-center gap-3 transition-transform duration-200 hover:scale-[1.02]">
                {siteSettingsStatus === 'loading' ? (
                  <BrandSkeleton />
                ) : siteSettingsStatus === 'success' ? (
                  <>
                    {siteLogoUrl && !brandLogoFailed ? (
                      <img
                        src={siteLogoUrl}
                        alt={`${siteName || 'Website'} logo`}
                        className="h-11 w-auto max-w-[3rem] object-contain lg:h-14 lg:max-w-[3.5rem]"
                        onError={() => setBrandLogoFailed(true)}
                      />
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c99b43]/25 bg-[#c99b43]/10 text-[#b98227] lg:h-14 lg:w-14 dark:border-[#c99b43]/35 dark:bg-white/5 dark:text-[#f3c96d]">
                        <Building2 size={22} />
                      </span>
                    )}
                    <span className="max-w-[8rem] truncate text-base font-semibold tracking-tight text-[#0b2141] sm:max-w-[11rem] sm:text-lg lg:max-w-[14rem] dark:text-[#f3c96d]">
                      <span className="bg-[linear-gradient(135deg,#0b2141,#c99b43)] bg-clip-text text-transparent dark:bg-[linear-gradient(135deg,#f7db96,#c99b43)]">
                        {siteName || 'Home'}
                      </span>
                    </span>
                  </>
                ) : (
                  <BrandFallback isDark={isDark} />
                )}
              </button>
            </div>

            {/* Center: bordered pill navigation (desktop) */}
            <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-slate-200/80 bg-white/70 p-1 shadow-sm backdrop-blur-md lg:flex dark:border-slate-700/60 dark:bg-slate-900/60">
              {navItems.map((item) => {
                const active = isNavActive(item.path)
                return (
                  <div key={item.label} className="relative">
                    {item.label === 'Properties' ? (
                      <div ref={propertyDropdownRef}>
                        <button
                          type="button"
                          onClick={(e) => {
                            const isChevron = e.target.closest('svg')
                            if (isChevron) {
                              setPropertyDropdownOpen(!propertyDropdownOpen)
                            } else {
                              navigateTo('/properties')
                            }
                          }}
                          onMouseEnter={() => setPropertyDropdownOpen(true)}
                          className={`relative flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition ${active || propertyDropdownOpen
                            ? 'bg-[#c99b43]/12 text-[#b98227] dark:bg-[#c99b43]/20 dark:text-[#f3c96d]'
                            : 'text-slate-700 hover:text-[#c99b43] dark:text-slate-100 dark:hover:text-[#f3c96d]'}`}
                        >
                          {active && (
                            <motion.span
                              layoutId="nav-active"
                              className="absolute inset-0 rounded-full bg-[#c99b43]/10 dark:bg-[#c99b43]/15"
                              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                            />
                          )}
                          <span className="relative">{item.label}</span>
                          <ChevronDown
                            size={14}
                            className={`relative transition-transform duration-200 ${propertyDropdownOpen ? 'rotate-180' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setPropertyDropdownOpen(!propertyDropdownOpen)
                            }}
                          />
                        </button>

                        <AnimatePresence>
                          {propertyDropdownOpen && (
                            <motion.div
                              key="nav-prop-menu"
                              initial={prefersReducedMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                              transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                              className="absolute left-0 top-full mt-3 w-60"
                              onMouseLeave={() => setPropertyDropdownOpen(false)}
                            >
                              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95">
                                <div className="max-h-96 overflow-y-auto p-2">
                                  <button
                                    type="button"
                                    onClick={() => handlePropertyTypeClick('')}
                                    className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
                                  >
                                    All Properties
                                  </button>
                                  {listingOptionsStatus === 'loading' && <DropdownSkeletonRows />}
                                  {listingOptionsStatus === 'error' && (
                                    <DropdownStatusRow message="Property categories are unavailable right now." />
                                  )}
                                  {listingOptionsStatus === 'success' && propertyCategories.length === 0 && (
                                    <DropdownStatusRow message="No property categories available." />
                                  )}
                                  {listingOptionsStatus === 'success' && propertyCategories.map((type) => (
                                    <button
                                      key={type.value}
                                      type="button"
                                      onClick={() => handlePropertyTypeClick(type.listing_type)}
                                      className="block w-full truncate rounded-xl px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
                                    >
                                      {type.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : item.label === 'Vehicles' ? (
                      <div ref={vehicleDropdownRef}>
                        <div onMouseEnter={() => setVehicleDropdownOpen(true)} className="flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setVehicleDropdownOpen(false)
                              navigateTo('/vehicles')
                            }}
                            className={`relative flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition ${active || vehicleDropdownOpen
                              ? 'bg-[#c99b43]/12 text-[#b98227] dark:bg-[#c99b43]/20 dark:text-[#f3c96d]'
                              : 'text-slate-700 hover:text-[#c99b43] dark:text-slate-100 dark:hover:text-[#f3c96d]'}`}
                          >
                            {active && (
                              <motion.span
                                layoutId="nav-active"
                                className="absolute inset-0 rounded-full bg-[#c99b43]/10 dark:bg-[#c99b43]/15"
                                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                              />
                            )}
                            <span className="relative">{item.label}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setVehicleDropdownOpen(!vehicleDropdownOpen)}
                            className="flex items-center rounded-full p-1 text-sm font-medium text-slate-700 transition hover:text-[#c99b43] dark:text-slate-100 dark:hover:text-[#f3c96d]"
                            aria-label="Toggle vehicle types"
                          >
                            <ChevronDown
                              size={14}
                              className={`transition-transform duration-200 ${vehicleDropdownOpen ? 'rotate-180' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setVehicleDropdownOpen(!vehicleDropdownOpen)
                              }}
                            />
                          </button>
                        </div>

                        <AnimatePresence>
                          {vehicleDropdownOpen && (
                            <motion.div
                              key="nav-veh-menu"
                              initial={prefersReducedMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                              transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                              className="absolute left-0 top-full mt-3 w-60"
                              onMouseLeave={() => setVehicleDropdownOpen(false)}
                            >
                              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95">
                                <div className="max-h-96 overflow-y-auto p-2">
                                  <button
                                    type="button"
                                    onClick={() => handleVehicleTypeClick('')}
                                    className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
                                  >
                                    All Vehicles
                                  </button>
                                  {listingOptionsStatus === 'loading' && <DropdownSkeletonRows />}
                                  {listingOptionsStatus === 'error' && (
                                    <DropdownStatusRow message="Vehicle categories are unavailable right now." />
                                  )}
                                  {listingOptionsStatus === 'success' && vehicleCategories.length === 0 && (
                                    <DropdownStatusRow message="No vehicle categories available." />
                                  )}
                                  {listingOptionsStatus === 'success' && vehicleCategories.map((type) => (
                                    <button
                                      key={type.value}
                                      type="button"
                                      onClick={() => handleVehicleTypeClick(type.listing_type)}
                                      className="block w-full truncate rounded-xl px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
                                    >
                                      {type.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigateTo(item.path)}
                        className={`relative flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition ${active
                          ? 'text-[#b98227] dark:text-[#f3c96d]'
                          : 'text-slate-700 hover:text-[#c99b43] dark:text-slate-100 dark:hover:text-[#f3c96d]'}`}
                      >
                        {active && (
                          <motion.span
                            layoutId="nav-active"
                            className="absolute inset-0 rounded-full bg-[#c99b43]/10 dark:bg-[#c99b43]/15"
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                          />
                        )}
                        <span className="relative">{item.label}</span>
                        {item.hasDropdown && <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>
                )
              })}
            </nav>

            {/* Right: search toggle, theme, favorites, user */}
            <div className="flex items-center gap-1.5 lg:gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen((open) => !open)}
                aria-label={searchOpen ? 'Close search' : 'Open search'}
                aria-expanded={searchOpen}
                title={searchOpen ? 'Close search' : 'Search'}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 ${searchOpen
                  ? 'bg-[#c99b43] text-white shadow-md'
                  : 'border border-[#c99b43]/35 bg-[#c99b43]/8 text-[#b98227] hover:bg-[#c99b43] hover:text-white dark:border-[#c99b43]/40 dark:bg-white/6 dark:text-[#f3c96d] dark:hover:bg-[#c99b43] dark:hover:text-white'}`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={searchOpen ? 'close' : 'search'}
                    initial={prefersReducedMotion ? false : { rotate: -90, opacity: 0, scale: 0.6 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { rotate: 90, opacity: 0, scale: 0.6 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                    className="flex items-center justify-center"
                  >
                    {searchOpen ? <X size={17} /> : <Search size={17} />}
                  </motion.span>
                </AnimatePresence>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c99b43]/35 bg-[#c99b43]/8 text-[#b98227] transition-all duration-200 hover:bg-[#c99b43]/12 hover:scale-105 dark:border-[#c99b43]/40 dark:bg-white/6 dark:text-[#f3c96d] dark:hover:bg-white/10"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Light mode' : 'Dark mode'}
              >
                {isDark ? <SunMedium size={17} /> : <Moon size={17} />}
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="hidden h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-all duration-200 hover:bg-[#c99b43]/10 hover:text-[#c99b43] hover:scale-105 sm:flex lg:flex dark:text-slate-100 dark:hover:bg-[#c99b43]/10 dark:hover:text-[#f3c96d]"
                aria-label="Favorites"
                title="Favorites"
              >
                <Heart size={16} />
              </button>

              {loading ? (
                <span className="hidden rounded-full border border-[#c99b43]/30 px-2.5 py-1 text-[11px] font-semibold text-[#b27a23] lg:block dark:text-[#f3c96d]">
                  Checking session...
                </span>
              ) : user ? (
                <div className="relative" ref={authDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setAuthDropdownOpen((open) => !open)}
                    className="flex items-center gap-2 rounded-full border border-[#c99b43]/30 bg-[#c99b43]/8 p-1 pr-2 text-slate-700 transition hover:bg-[#c99b43]/12 dark:border-[#c99b43]/40 dark:bg-white/5 dark:text-white"
                    aria-label="Open profile menu"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f3cd7a,#c68c2b)] text-sm font-semibold text-slate-950 shadow-sm">
                      {profileImageUrl ? (
                        <img
                          src={profileImageUrl}
                          alt={profileLabel}
                          className="h-full w-full rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.textContent = userInitial
                          }}
                        />
                      ) : (
                        userInitial
                      )}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`hidden transition-transform duration-200 sm:block ${authDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {authDropdownOpen && (
                      <motion.div
                        key="auth-menu"
                        initial={prefersReducedMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                        className="absolute right-0 top-full mt-3 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setAuthDropdownOpen(false)
                            const dashboardRoute = getDashboardRoute(user?.role)
                            navigate(dashboardRoute)
                          }}
                          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
                        >
                          <User size={15} />
                          <span>Profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuthDropdownOpen(false)}
                          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
                        >
                          <Settings size={15} />
                          <span>Settings</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
                        >
                          <LogOut size={15} />
                          <span>Log out</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="relative" ref={authDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setAuthDropdownOpen((open) => !open)}
                    className="flex items-center gap-1.5 rounded-full border border-[#c99b43]/35 p-1.5 pr-2 text-sm font-medium text-slate-700 transition hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-100 dark:hover:bg-white/5 dark:hover:text-[#f3c96d]"
                    aria-label="Open account menu"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c99b43]/10 text-[#b98227] dark:bg-white/5 dark:text-[#f3c96d]">
                      <User size={15} />
                    </span>
                    <span className="hidden lg:inline">Sign In</span>
                    <ChevronDown
                      size={16}
                      className={`hidden transition-transform duration-200 sm:block ${authDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {authDropdownOpen && (
                      <motion.div
                        key="auth-menu-guest"
                        initial={prefersReducedMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                        className="absolute right-0 top-full mt-3 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setAuthDropdownOpen(false)
                            navigate('/login')
                          }}
                          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
                        >
                          <User size={15} />
                          <span>Sign In</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthDropdownOpen(false)
                            navigate('/register')
                          }}
                          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
                        >
                          <User size={15} />
                          <span>Sign Up</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* ─── Expandable search panel ─────────────────────────────── */}
          <AnimatePresence initial={false}>
            {searchOpen && (
              <motion.div
                key="search-panel"
                initial={prefersReducedMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <form
                  onSubmit={handleSearchSubmit}
                  className="mx-auto flex w-full flex-col gap-3 pb-4 sm:pb-5 lg:max-w-4xl"
                >
                  <div className="flex flex-col divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-[#c99b43]/5 lg:flex-row lg:items-center lg:divide-x lg:divide-y-0 dark:divide-slate-700/60 dark:border-slate-700/60 dark:bg-slate-900">
                    {/* Location */}
                    <label className="group flex flex-1 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 focus-within:bg-slate-50 dark:hover:bg-slate-950/40 dark:focus-within:bg-slate-950/40">
                      <MapPin className="h-5 w-5 shrink-0 text-[#c99b43]" />
                      <span className="flex-1">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Location</span>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          placeholder="Where are you going?"
                          className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                        />
                      </span>
                    </label>

                    {/* Property type */}
                    <div className="group relative flex flex-1 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-950/40">
                      <HomeIcon className="h-5 w-5 shrink-0 text-[#c99b43]" />
                      <span className="flex-1">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Property type</span>
                        <select
                          aria-label="Property type"
                          defaultValue=""
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === 'all') {
                              handlePropertyTypeClick('')
                            } else if (val) {
                              const match = propertyCategories.find((c) => c.value === val)
                              if (match) handlePropertyTypeClick(match.listing_type)
                            }
                          }}
                          className="w-full appearance-none bg-transparent text-sm font-medium text-slate-700 outline-none dark:text-slate-200"
                        >
                          <option value="all" className="bg-white dark:bg-slate-900">Any property</option>
                          {listingOptionsStatus === 'success' &&
                            propertyCategories.map((type) => (
                              <option key={type.value} value={type.value} className="bg-white dark:bg-slate-900">{type.label}</option>
                            ))}
                        </select>
                      </span>
                      <ChevronDown size={15} className="shrink-0 text-slate-400" />
                    </div>

                    {/* Vehicle type */}
                    <div className="group relative flex flex-1 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-950/40">
                      <Car className="h-5 w-5 shrink-0 text-[#c99b43]" />
                      <span className="flex-1">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Vehicle type</span>
                        <select
                          aria-label="Vehicle type"
                          defaultValue=""
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === 'all') {
                              handleVehicleTypeClick('')
                            } else if (val) {
                              const match = vehicleCategories.find((c) => c.value === val)
                              if (match) handleVehicleTypeClick(match.listing_type)
                            }
                          }}
                          className="w-full appearance-none bg-transparent text-sm font-medium text-slate-700 outline-none dark:text-slate-200"
                        >
                          <option value="all" className="bg-white dark:bg-slate-900">Any vehicle</option>
                          {listingOptionsStatus === 'success' &&
                            vehicleCategories.map((type) => (
                              <option key={type.value} value={type.value} className="bg-white dark:bg-slate-900">{type.label}</option>
                            ))}
                        </select>
                      </span>
                      <ChevronDown size={15} className="shrink-0 text-slate-400" />
                    </div>

                    {/* Search button */}
                    <div className="flex items-center justify-center p-2 lg:p-3">
                      <button
                        type="submit"
                        aria-label="Search properties"
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c99b43] to-[#f3c96d] px-6 text-sm font-semibold text-slate-950 shadow-sm transition-all duration-200 hover:shadow-lg hover:shadow-[#c99b43]/25 hover:scale-[1.02] active:scale-95 lg:w-12 lg:rounded-full"
                      >
                        <Search className="h-5 w-5" />
                        <span className="lg:hidden">Search</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                    Search by location, or pick a property or vehicle type.
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              key="mobile-nav-backdrop"
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
            />

            <motion.aside
              key="mobile-nav-drawer"
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              className="fixed inset-y-0 left-0 z-[60] flex w-[min(82vw,320px)] flex-col border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.01 }
                  : { type: 'spring', stiffness: 260, damping: 28 }
              }
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <button
                  type="button"
                  className="flex items-center gap-3"
                  onClick={() => navigateTo('/')}
                >
                  {siteSettingsStatus === 'loading' ? (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                      <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                  ) : (
                    <>
                      {siteLogoUrl && !brandLogoFailed ? (
                        <img
                          src={siteLogoUrl}
                          alt={`${siteName || 'Website'} logo`}
                          className="h-10 w-auto max-w-[2.5rem] object-contain"
                          onError={() => setBrandLogoFailed(true)}
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c99b43]/25 bg-[#c99b43]/10 text-[#b98227] dark:border-[#c99b43]/35 dark:bg-white/5 dark:text-[#f3c96d]">
                          <Building2 size={20} />
                        </span>
                      )}
                      <span className="max-w-[11rem] truncate text-lg font-semibold tracking-tight text-[#0b2141] dark:text-[#f3c96d] sm:max-w-[14rem]">
                        <span className="bg-[linear-gradient(135deg,#0b2141,#c99b43)] bg-clip-text text-transparent dark:bg-[linear-gradient(135deg,#f7db96,#c99b43)]">
                          {siteName || 'Home'}
                        </span>
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-4">
                <form onSubmit={handleSearchSubmit} className="mb-5 px-1">
                  <label className="relative block">
                    <span className="sr-only">Search properties</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c99b43]" />
                    <Star className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c99b43]" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search properties"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-10 text-sm text-slate-900 outline-none focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                    />
                  </label>
                </form>
                <div className="mb-5 space-y-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-[#c99b43] dark:border-slate-700 dark:bg-slate-950">
                      {user && profileImageUrl ? <img src={profileImageUrl} alt={userLabel} className="h-full w-full object-cover" /> : <User className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user ? `Welcome, ${userLabel}` : 'Welcome!'}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user ? (user.email || 'Your account') : 'Sign in to your account'}</p>
                    </div>
                  </div>
                  {!loading && !user && <div className="flex flex-col items-start gap-2 px-1"><button type="button" onClick={() => navigateTo('/login')} className="text-sm font-semibold text-slate-700 transition hover:text-[#c99b43] dark:text-slate-200 dark:hover:text-[#f3c96d]">Sign In</button><button type="button" onClick={() => navigateTo('/register')} className="text-sm font-semibold text-slate-700 transition hover:text-[#c99b43] dark:text-slate-200 dark:hover:text-[#f3c96d]">Create Account</button></div>}
                  {user && <button type="button" onClick={() => navigateTo(getDashboardRoute(user.role))} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">Open dashboard <ChevronRight className="h-4 w-4 text-slate-400" /></button>}
                </div>

                <div className="mb-5">
                  <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b27a23]">Appearance</p>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
                    <button type="button" onClick={() => isDark && toggleTheme()} className={`flex flex-1 items-center justify-center rounded-lg py-2 ${!isDark ? 'bg-[#c99b43] text-white shadow-sm' : 'text-slate-500'}`} aria-label="Light mode"><SunMedium className="h-4 w-4" /></button>
                    <button type="button" onClick={() => !isDark && toggleTheme()} className={`flex flex-1 items-center justify-center rounded-lg py-2 ${isDark ? 'bg-[#c99b43] text-white shadow-sm' : 'text-slate-500'}`} aria-label="Dark mode"><Moon className="h-4 w-4" /></button>
                  </div>
                </div>

                {user && (
                  <div className="mb-5 space-y-1">
                    <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b27a23]">Account</p>
                    <button type="button" onClick={() => navigateTo(getDashboardRoute(user.role))} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"><span className="flex items-center gap-3"><User className="h-4 w-4 text-[#c99b43]" />Profile</span><ChevronRight className="h-4 w-4 text-slate-400" /></button>
                    <button type="button" onClick={() => navigateTo(user.role === 'owner' ? '/owner/favorites' : '/tenant/favorites')} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"><span className="flex items-center gap-3"><Heart className="h-4 w-4 text-[#c99b43]" />Favorite</span><ChevronRight className="h-4 w-4 text-slate-400" /></button>
                    <button type="button" onClick={() => navigateTo(user.role === 'owner' ? '/owner/settings' : user.role === 'admin' ? '/admin-dashboard/settings' : '/tenant/settings')} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"><span className="flex items-center gap-3"><Settings className="h-4 w-4 text-[#c99b43]" />Setting</span><ChevronRight className="h-4 w-4 text-slate-400" /></button>
                    <button type="button" onClick={() => navigateTo(getDashboardRoute(user.role))} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"><span className="flex items-center gap-3"><Building2 className="h-4 w-4 text-[#c99b43]" />Dashboard</span><ChevronRight className="h-4 w-4 text-slate-400" /></button>
                    <button type="button" onClick={handleLogout} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"><span className="flex items-center gap-3"><LogOut className="h-4 w-4 text-red-500" />Logout</span><ChevronRight className="h-4 w-4 text-slate-400" /></button>
                  </div>
                )}

                <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b27a23]">Quick Access</p>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => navigateTo('/')}
                    className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-900"
                  >
                    Home
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                  <button type="button" onClick={() => navigateTo('/about')} className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-900">About Us <ChevronRight className="h-4 w-4 text-slate-400" /></button>

                  {/* Properties (collapsible) */}
                  <button
                    type="button"
                    onClick={() => setMobilePropertyOpen((open) => !open)}
                    className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-900"
                    aria-expanded={mobilePropertyOpen}
                  >
                    <span className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-[#c99b43]" />
                      Properties
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${mobilePropertyOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {mobilePropertyOpen && (
                      <motion.div
                        key="mobile-properties"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 px-2 pb-2">
                          <button
                            type="button"
                            onClick={() => handlePropertyTypeClick('')}
                            className="w-full rounded-xl px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                          >
                            All Properties
                          </button>
                          {listingOptionsStatus === 'loading' && (
                            <div className="space-y-2 px-4 py-2">
                              <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                              <div className="h-4 w-3/5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                            </div>
                          )}
                          {listingOptionsStatus === 'success' &&
                            propertyCategories.map((type) => (
                              <button
                                key={`mobile-prop-${type.value}`}
                                type="button"
                                onClick={() => handlePropertyTypeClick(type.listing_type)}
                                className="w-full rounded-xl px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                              >
                                {type.label}
                              </button>
                            ))}
                          {listingOptionsStatus === 'error' && (
                            <p className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400">
                              Property categories are unavailable right now.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Vehicles (collapsible) */}
                  <button
                    type="button"
                    onClick={() => setMobileVehicleOpen((open) => !open)}
                    className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-900"
                    aria-expanded={mobileVehicleOpen}
                  >
                    <span className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-[#c99b43]" />
                      Vehicles
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${mobileVehicleOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {mobileVehicleOpen && (
                      <motion.div
                        key="mobile-vehicles"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 px-2 pb-2">
                          <button
                            type="button"
                            onClick={() => handleVehicleTypeClick('')}
                            className="w-full rounded-xl px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                          >
                            All Vehicles
                          </button>
                          {listingOptionsStatus === 'loading' && (
                            <div className="space-y-2 px-4 py-2">
                              <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                              <div className="h-4 w-3/5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                            </div>
                          )}
                          {listingOptionsStatus === 'success' &&
                            vehicleCategories.map((type) => (
                              <button
                                key={`mobile-veh-${type.value}`}
                                type="button"
                                onClick={() => handleVehicleTypeClick(type.listing_type)}
                                className="w-full rounded-xl px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                              >
                                {type.label}
                              </button>
                            ))}
                          {listingOptionsStatus === 'error' && (
                            <p className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400">
                              Vehicle categories are unavailable right now.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>

              <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
                <p className="text-center text-[10px] text-slate-400">Browse the marketplace</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar