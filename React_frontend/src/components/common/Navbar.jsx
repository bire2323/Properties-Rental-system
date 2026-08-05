import { useState, useRef, useEffect } from 'react'
import {
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  Moon,
  Settings,
  SunMedium,
  User,
} from 'lucide-react'
import logo from '../../assets/logo.jpg'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'

const propertyTypes = [
  { label: 'All Properties', value: '' },
  { label: 'Apartment', value: 'apartment' },
  { label: 'House', value: 'house' },
  { label: 'Villa', value: 'villa' },
  { label: 'Studio', value: 'studio' },
  { label: 'Condominium', value: 'condo' },
  { label: 'Penthouse', value: 'penthouse' },
  { label: 'Townhouse', value: 'townhouse' },
  { label: 'Mansion', value: 'mansion' },
  { label: 'Commercial', value: 'commercial' },
  { label: 'Office', value: 'office' },
  { label: 'Land', value: 'land' },
  { label: 'Warehouse', value: 'warehouse' },
  { label: 'Shop', value: 'shop' },
]

const vehicleTypes = [
  { label: 'All Vehicles', value: '' },
  { label: 'Sedan', value: 'sedan' },
  { label: 'SUV', value: 'suv' },
  { label: 'Hatchback', value: 'hatchback' },
  { label: 'Coupe', value: 'coupe' },
  { label: 'Convertible', value: 'convertible' },
  { label: 'Pickup Truck', value: 'pickup-truck' },
  { label: 'Van', value: 'van' },
  { label: 'Minibus', value: 'minibus' },
  { label: 'Bus', value: 'bus' },
  { label: 'Motorcycle', value: 'motorcycle' },
  { label: 'Scooter', value: 'scooter' },
  { label: 'Bicycle', value: 'bicycle' },
  { label: 'Truck', value: 'truck' },
  { label: 'Trailer', value: 'trailer' },
]

const navItems = [
  { label: 'Home', href: '#home', hasDropdown: false },
  { label: 'Properties', href: '#properties', hasDropdown: false },
  { label: 'Vehicles', href: '#vehicles', hasDropdown: false },
  { label: 'About Us', href: '#about', hasDropdown: false },
]

function Navbar() {
  const { isDark, toggleTheme } = useTheme()
  const { user, logout, loading } = useAuth()
  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false)
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false)
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false)
  const propertyDropdownRef = useRef(null)
  const vehicleDropdownRef = useRef(null)
  const authDropdownRef = useRef(null)
  const navigateTo = (path) => {
    // #region debug-point A:navigate-to
    fetch('http://127.0.0.1:7777/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'vehicle-navbar-nav',
        runId: 'pre-fix',
        hypothesisId: 'A',
        location: 'src/components/common/Navbar.jsx:61',
        msg: '[DEBUG] Navbar navigateTo called',
        data: { path, currentHash: window.location.hash },
        ts: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    window.location.hash = path
    // #region debug-point A:hash-after-set
    setTimeout(() => {
      fetch('http://127.0.0.1:7777/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'vehicle-navbar-nav',
          runId: 'pre-fix',
          hypothesisId: 'A',
          location: 'src/components/common/Navbar.jsx:74',
          msg: '[DEBUG] Navbar hash after navigation',
          data: { path, nextHash: window.location.hash },
          ts: Date.now(),
        }),
      }).catch(() => {})
    }, 0)
    // #endregion
  }
  const getHashPath = (path) => {
    return `#${path}`
  }
  const userLabel = user?.first_name || user?.email?.split('@')[0] || 'User'
  const userInitial = userLabel.charAt(0).toUpperCase()

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

  const handlePropertyTypeClick = (value) => {
    setPropertyDropdownOpen(false)
    if (value) {
      navigateTo(`properties?type=${value}`)
    } else {
      navigateTo('properties')
    }
  }

  const handleVehicleTypeClick = (value) => {
    // #region debug-point A:vehicle-type-click
    fetch('http://127.0.0.1:7777/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'vehicle-navbar-nav',
        runId: 'pre-fix',
        hypothesisId: 'A',
        location: 'src/components/common/Navbar.jsx:126',
        msg: '[DEBUG] Vehicle type menu clicked',
        data: { value, currentHash: window.location.hash },
        ts: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    setVehicleDropdownOpen(false)
    if (value) {
      navigateTo(`vehicles?type=${value}`)
    } else {
      navigateTo('vehicles')
    }
  }

  const handleLogout = async () => {
    setAuthDropdownOpen(false)
    await logout()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#c99b43]/25 bg-white/90 text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-[#c99b43]/35 dark:bg-[linear-gradient(90deg,#03172f_0%,#04254a_55%,#03172f_100%)] dark:text-white dark:shadow-[0_18px_50px_rgba(3,12,26,0.35)]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#home" className="flex shrink-0 items-center gap-3">
          <img
            src={logo}
            alt="NX Rent logo"
            className="h-14 w-auto object-contain"
          />
          <span className="text-lg font-semibold tracking-tight text-[#0b2141] dark:text-[#f3c96d]">
            <span className="bg-[linear-gradient(135deg,#0b2141,#c99b43)] bg-clip-text text-transparent dark:bg-[linear-gradient(135deg,#f7db96,#c99b43)]">
              NexaSpace
            </span>
          </span>
        </a>

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
                        navigateTo('properties')
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
                          {propertyTypes.map((type) => (
                            <a
                              key={type.value}
                              href={getHashPath(type.value ? `properties?type=${type.value}` : 'properties')}
                              onClick={() => handlePropertyTypeClick(type.value)}
                              className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
                            >
                              {type.label}
                            </a>
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
                    <a
                      href="#vehicles"
                      onClick={() => {
                        // #region debug-point D:vehicles-nav-link
                        fetch('http://127.0.0.1:7777/event', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            sessionId: 'vehicle-navbar-nav',
                            runId: 'post-fix',
                            hypothesisId: 'D',
                            location: 'src/components/common/Navbar.jsx:225',
                            msg: '[DEBUG] Vehicles nav label clicked',
                            data: { currentHash: window.location.hash, nextHash: '#vehicles' },
                            ts: Date.now(),
                          }),
                        }).catch(() => {})
                        // #endregion
                        setVehicleDropdownOpen(false)
                      }}
                      className="px-2 py-1 text-sm font-medium text-slate-700 transition hover:text-[#c99b43] dark:text-slate-100 dark:hover:text-[#f3c96d]"
                    >
                      <span>{item.label}</span>
                    </a>
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
                          {vehicleTypes.map((type) => (
                            <a
                              key={type.value}
                              href={getHashPath(type.value ? `vehicles?type=${type.value}` : 'vehicles')}
                              onClick={() => handleVehicleTypeClick(type.value)}
                              className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
                            >
                              {type.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <a
                  href={item.href}
                  className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-slate-700 transition hover:text-[#c99b43] dark:text-slate-100 dark:hover:text-[#f3c96d]"
                >
                  <span>{item.label}</span>
                  {item.hasDropdown && <ChevronDown size={16} />}
                </a>
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

          <a
            href="#home"
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-100 dark:hover:bg-[#c99b43]/10 dark:hover:text-[#f3c96d]"
            aria-label="Favorites"
            title="Favorites"
          >
            <Heart size={16} />
          </a>

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
                  {userInitial}
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
                    onClick={() => setAuthDropdownOpen(false)}
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
                <div className="absolute right-0 top-full mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  <a
                    href="#login"
                    onClick={() => setAuthDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
                  >
                    <User size={15} />
                    <span>Sign In</span>
                  </a>
                  <a
                    href="#register"
                    onClick={() => setAuthDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
                  >
                    <User size={15} />
                    <span>Sign Up</span>
                  </a>
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
