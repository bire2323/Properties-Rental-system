import { useState, useRef, useEffect } from 'react'
import {
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  Moon,
  SunMedium,
  User,
} from 'lucide-react'
import logo from '../../assets/logo.jpg'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'

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

const navItems = [
  { label: 'Home', href: '#home', hasDropdown: false },
  { label: 'Properties', href: '#properties', hasDropdown: true },
  { label: 'Vehicles', href: '#vehicles', hasDropdown: true },
  { label: 'About Us', href: '#about', hasDropdown: false },
  { label: 'How It Works', href: '#how-it-works', hasDropdown: false },
  { label: 'Contact', href: '#contact', hasDropdown: false },
]

function Navbar() {
  const { isDark, toggleTheme } = useTheme()
  const { user, logout, loading } = useAuth()
  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setPropertyDropdownOpen(false)
      }
    }

    if (propertyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [propertyDropdownOpen])

  const handlePropertyTypeClick = (value) => {
    console.log('Property type clicked:', value) // Debug log
    setPropertyDropdownOpen(false)
    if (value) {
      window.location.hash = `properties?type=${value}`
    } else {
      window.location.hash = 'properties'
    }
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
                <div ref={dropdownRef}>
                  <button
                    onClick={(e) => {
                      // If clicking on the chevron, toggle dropdown
                      // If clicking on the text, navigate to properties page
                      const isChevron = e.target.closest('svg')
                      if (isChevron) {
                        setPropertyDropdownOpen(!propertyDropdownOpen)
                      } else {
                        window.location.hash = 'properties'
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
                            <button
                              key={type.value}
                              onClick={() => handlePropertyTypeClick(type.value)}
                              className="w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
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
            className="flex items-center gap-1.5 text-sm font-medium text-slate-700 transition hover:text-[#c99b43] dark:text-slate-100 dark:hover:text-[#f3c96d]"
          >
            <Heart size={16} />
            <span>Favorites</span>
          </a>

          {loading ? (
            <span className="rounded-full border border-[#c99b43]/30 px-2.5 py-1 text-[11px] font-semibold text-[#b27a23] dark:text-[#f3c96d]">
              Checking session...
            </span>
          ) : user ? (
            <div className="flex items-center gap-2 rounded-full border border-[#c99b43]/30 bg-[#c99b43]/8 px-2 py-1 dark:border-[#c99b43]/40 dark:bg-white/5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#b27a23] dark:bg-slate-800 dark:text-[#f3c96d]">
                <User size={14} />
              </span>
              <div className="min-w-0 text-left">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#b27a23] dark:text-[#f3c96d]">
                  Signed in
                </div>
                <div className="truncate text-xs font-semibold text-slate-800 dark:text-white">
                  {user.first_name || user.email?.split('@')[0] || 'User'}
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1 rounded-full border border-[#c99b43]/30 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-[#c99b43]/10 dark:border-[#c99b43]/40 dark:text-white dark:hover:bg-[#c99b43]/10"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <>
              <a
                href="#login"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-700 transition hover:text-[#c99b43] dark:text-slate-100 dark:hover:text-[#f3c96d]"
              >
                <User size={16} />
                <span>Login</span>
              </a>
              <a
                href="#register"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-700 transition hover:text-[#c99b43] dark:text-slate-100 dark:hover:text-[#f3c96d]"
              >
                <User size={16} />
                <span>Register</span>
              </a>
            </>
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
