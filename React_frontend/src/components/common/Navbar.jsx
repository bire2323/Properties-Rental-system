import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardRoute } from '@/services/authService'
import { getImageUrl } from '@/lib/utils'
import {
  Building2,
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  Moon,
  Settings,
  SunMedium,
  User,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { getSiteSettings, resolveSiteMediaUrl } from '../../api/siteSettingsApi'
import { getListingNavigationOptions } from '../../api/property/propertyApi'
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
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
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
  const [brandLogoFailed, setBrandLogoFailed] = useState(false)
  const propertyDropdownRef = useRef(null)
  const vehicleDropdownRef = useRef(null)
  const authDropdownRef = useRef(null)

  const profileLabel = user?.first_name
  const profileImageUrl = user?.profile_image ? getImageUrl(user.profile_image) : null
  const navigateTo = (path) => {
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
        // Fetch both property and vehicle categories
        const [propertyData, vehicleData] = await Promise.all([
          getPublicCategories('house'),
          getPublicCategories('car'),
        ])

        if (!isActive) return

        // Transform the data to match the dropdown structure
        const transformCategories = (data) => {
          return Array.isArray(data)
            ? data.map((item) => ({
              value: item.name, // or item.id if you prefer
              label: item.name.charAt(0).toUpperCase() + item.name.slice(1), // Capitalize
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
    let isActive = true

    setListingOptionsStatus('loading')
    getListingNavigationOptions()
      .then((data) => {
        if (!isActive) return
        setListingOptions({
          property_categories: Array.isArray(data?.property_categories) ? data.property_categories : [],
          vehicle_categories: Array.isArray(data?.vehicle_categories) ? data.vehicle_categories : [],
        })
        setListingOptionsStatus('success')
      })
      .catch(() => {
        if (!isActive) return
        setListingOptionsStatus('error')
      })

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

  useEffect(() => {
    setBrandLogoFailed(false)
  }, [siteSettings?.logo])

  const handlePropertyTypeClick = (value) => {
    setPropertyDropdownOpen(false)
    if (value) {
      navigateTo(`/properties?type=${value}`)
    } else {
      navigateTo('/properties')
    }
  }

  const handleVehicleTypeClick = (value) => {
    setVehicleDropdownOpen(false)
    if (value) {
      navigateTo(`/vehicles?type=${value}`)
    } else {
      navigateTo('/vehicles')
    }
  }

  const handleLogout = async () => {
    setAuthDropdownOpen(false)
    await logout()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#c99b43]/25 bg-white/90 text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-[#c99b43]/35 dark:bg-[linear-gradient(90deg,#03172f_0%,#04254a_55%,#03172f_100%)] dark:text-white dark:shadow-[0_18px_50px_rgba(3,12,26,0.35)]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={() => navigate('/')} className="flex shrink-0 items-center gap-3">
          {siteSettingsStatus === 'loading' ? (
            <BrandSkeleton />
          ) : siteSettingsStatus === 'success' ? (
            <>
              {siteLogoUrl && !brandLogoFailed ? (
                <img
                  src={siteLogoUrl}
                  alt={`${siteName || 'Website'} logo`}
                  className="h-14 w-auto max-w-[3.5rem] object-contain"
                  onError={() => setBrandLogoFailed(true)}
                />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#c99b43]/25 bg-[#c99b43]/10 text-[#b98227] dark:border-[#c99b43]/35 dark:bg-white/5 dark:text-[#f3c96d]">
                  <Building2 size={26} />
                </span>
              )}
              <span className="max-w-[11rem] truncate text-lg font-semibold tracking-tight text-[#0b2141] dark:text-[#f3c96d] sm:max-w-[14rem]">
                <span className="bg-[linear-gradient(135deg,#0b2141,#c99b43)] bg-clip-text text-transparent dark:bg-[linear-gradient(135deg,#f7db96,#c99b43)]">
                  {siteName || 'Home'}
                </span>
              </span>
            </>
          ) : (
            <BrandFallback isDark={isDark} />
          )}
        </button>

        <nav className="hidden items-center gap-5 lg:flex">
          {navItems.map((item) => (
            <div key={item.label} className="relative">
              {item.label === 'Properties' ? (
                <div ref={propertyDropdownRef}>
                  <button
                    onClick={(e) => {
                      // If clicking on the chevron, toggle dropdown
                      // If clicking on the text, navigate to properties page
                      const isChevron = e.target.closest('svg')
                      if (isChevron) {
                        setPropertyDropdownOpen(!propertyDropdownOpen)
                      } else {
                        navigateTo('/properties')
                      }
                    }}
                    onMouseEnter={() => setPropertyDropdownOpen(true)}
                    className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-slate-700 transition hover:text-[#c99b43] dark:text-slate-100 dark:hover:text-[#f3c96d]"
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${propertyDropdownOpen ? 'rotate-180' : ''
                        }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setPropertyDropdownOpen(!propertyDropdownOpen)
                      }}
                    />
                  </button>

                  {/* Property Dropdown Menu */}
                  {propertyDropdownOpen && (
                    <div
                      className="absolute left-0 top-full mt-2 w-56 animate-in fade-in slide-in-from-top-2 duration-200"
                      onMouseLeave={() => setPropertyDropdownOpen(false)}
                    >
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="max-h-96 overflow-y-auto p-2">
                          <button
                            type="button"
                            onClick={() => handlePropertyTypeClick('')}
                            className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
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
                              onClick={() => handlePropertyTypeClick(type.value)}
                              className="block w-full truncate rounded-lg px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
                            >
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : item.label === 'Vehicles' ? (
                <div ref={vehicleDropdownRef}>
                  <div
                    onMouseEnter={() => setVehicleDropdownOpen(true)}
                    className="flex items-center gap-1"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setVehicleDropdownOpen(false)
                        navigate('/vehicles')
                      }}
                      className="px-2 py-1 text-sm font-medium text-slate-700 transition hover:text-[#c99b43] dark:text-slate-100 dark:hover:text-[#f3c96d]"
                    >
                      <span>{item.label}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVehicleDropdownOpen(!vehicleDropdownOpen)}
                      className="flex items-center px-1 py-1 text-sm font-medium text-slate-700 transition hover:text-[#c99b43] dark:text-slate-100 dark:hover:text-[#f3c96d]"
                      aria-label="Toggle vehicle types"
                    >
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${vehicleDropdownOpen ? 'rotate-180' : ''
                          }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setVehicleDropdownOpen(!vehicleDropdownOpen)
                        }}
                      />
                    </button>
                  </div>

                  {vehicleDropdownOpen && (
                    <div
                      className="absolute left-0 top-full mt-2 w-56 animate-in fade-in slide-in-from-top-2 duration-200"
                      onMouseLeave={() => setVehicleDropdownOpen(false)}
                    >
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="max-h-96 overflow-y-auto p-2">
                          <button
                            type="button"
                            onClick={() => handleVehicleTypeClick('')}
                            className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
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
                              onClick={() => handleVehicleTypeClick(type.value)}
                              className="block w-full truncate rounded-lg px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
                            >
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-slate-700 transition hover:text-[#c99b43] dark:text-slate-100 dark:hover:text-[#f3c96d]"
                >
                  <span>{item.label}</span>
                  {item.hasDropdown && <ChevronDown size={16} />}
                </button>
              )}
            </div>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c99b43]/35 bg-[#c99b43]/8 text-[#b98227] transition hover:bg-[#c99b43]/12 dark:border-[#c99b43]/40 dark:bg-white/6 dark:text-[#f3c96d]"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <SunMedium size={17} /> : <Moon size={17} />}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-100 dark:hover:bg-[#c99b43]/10 dark:hover:text-[#f3c96d]"
            aria-label="Favorites"
            title="Favorites"
          >
            <Heart size={16} />
          </button>

          {loading ? (
            <span className="rounded-full border border-[#c99b43]/30 px-2.5 py-1 text-[11px] font-semibold text-[#b27a23] dark:text-[#f3c96d]">
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
                  className={`transition-transform duration-200 ${authDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {authDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
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
                    <span>Setting</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
                  >
                    <LogOut size={15} />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative" ref={authDropdownRef}>
              <button
                type="button"
                onClick={() => setAuthDropdownOpen((open) => !open)}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-700 transition hover:text-[#c99b43] dark:text-slate-100 dark:hover:text-[#f3c96d]"
              >
                <User size={16} />
                <span>Sign In</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${authDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {authDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-fit overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthDropdownOpen(false)
                      navigate('/login')
                    }}
                    className="flex items-center w-30 gap-2 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
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
                    className="flex items-center w-30 gap-2 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
                  >
                    <User size={15} />
                    <span>Sign Up</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c99b43]/35 bg-[#c99b43]/8 text-[#b98227] dark:border-[#c99b43]/40 dark:bg-white/6 dark:text-[#f3c96d]"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <SunMedium size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c99b43]/35 bg-[#c99b43]/8 text-[#b98227] dark:border-[#c99b43]/40 dark:bg-white/6 dark:text-[#f3c96d]"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
