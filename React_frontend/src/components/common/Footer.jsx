import { useEffect, useState } from 'react'
import { Building2, Globe, Mail, MapPin, Phone, Send } from 'lucide-react'
import logo from '../../assets/logo.jpg'
import { getSiteSettings, resolveSiteMediaUrl } from '../../api/siteSettingsApi'

const footerSections = [
  {
    title: 'Company',
    links: ['About Us', 'How It Works', 'Careers', 'Blog', 'Contact Us'],
  },
  {
    title: 'Properties',
    links: ['Houses', 'Apartments', 'Cars', 'Offices', 'Land'],
  },
  {
    title: 'Support',
    links: ['Help Center', 'Terms of Service', 'Privacy Policy', 'FAQ'],
  },
  {
    title: 'For Owners',
    links: ['List Your Property', 'My Properties', 'Owner Dashboard'],
  },
]

const contactItems = [
  { icon: Phone, label: '+251 9XX XXX XXX' },
  { icon: Mail, label: 'info@nxrent.com' },
  { icon: MapPin, label: 'Addis Ababa, Ethiopia' },
]

const socialLinks = [
  { icon: Globe, label: 'Website' },
  { icon: Send, label: 'Updates' },
  { icon: Building2, label: 'Properties' },
  { icon: Mail, label: 'Email' },
]

function Footer() {
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    getSiteSettings().then(setSettings).catch(() => { })
  }, [])

  const currentLogo = resolveSiteMediaUrl(settings?.logo) || logo
  const siteName = settings?.site_name || 'NexaSpace'
  const contactItems = [
    { icon: Phone, label: settings?.contact_phone || '+251 9XX XXX XXX' },
    { icon: Mail, label: settings?.email || 'info@nxrent.com' },
    { icon: MapPin, label: settings?.address || 'Addis Ababa, Ethiopia' },
  ]

  return (
    <footer className="relative overflow-hidden border-t border-[#c99b43]/20 bg-[radial-gradient(circle_at_top,_rgba(205,160,69,0.12),_transparent_28%),linear-gradient(180deg,_#fffdf8_0%,_#f8fbff_100%)] text-slate-900 dark:border-[#c99b43]/30 dark:bg-[radial-gradient(circle_at_top,_rgba(205,160,69,0.18),_transparent_32%),linear-gradient(135deg,_#031226_0%,_#07244a_45%,_#031226_100%)] dark:text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f3c96d] to-transparent" />

      <div className="mx-auto max-w-screen-2xl px-6 py-14 sm:px-8 lg:px-10">
        {/* Desktop Footer Layout */}
        <div className="hidden lg:block">
          <div className="grid gap-10 border-b border-[#c99b43]/20 pb-10 lg:grid-cols-[1.25fr_repeat(4,0.8fr)] dark:border-[#c99b43]/20">
            <div className="max-w-sm">
              <div className="mb-5 flex items-center gap-3">
                <img
                  src={currentLogo}
                  alt="NX Rent logo"
                  className="h-20 w-auto rounded-2xl object-contain"
                />
                <span className="text-2xl font-semibold tracking-tight text-[#0b2141] dark:text-[#f3c96d]">
                  <span className="bg-[linear-gradient(135deg,_#0b2141,_#c99b43)] bg-clip-text text-transparent dark:bg-[linear-gradient(135deg,_#f7db96,_#c99b43)]">
                    {siteName}
                  </span>
                </span>
              </div>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                {settings?.description || 'Your trusted platform to rent or lease homes, cars, and other assets with a premium, reliable experience.'}
              </p>

              <div className="mt-6 flex items-center gap-3">
                {socialLinks.map(({ icon: Icon, label }) => (
                  <a
                    key={label}
                    href="/"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c99b43]/30 bg-[#c99b43]/8 text-[#b98227] transition hover:-translate-y-0.5 hover:bg-[#c99b43]/12 dark:border-[#c99b43]/35 dark:bg-white/5 dark:text-[#f3c96d]"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f3c96d]">
                  {section.title}
                </h3>
                <ul className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a
                        href="/"
                        className="transition hover:text-[#c99b43] dark:hover:text-[#f7d78e]"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="grid gap-8 pt-8 lg:grid-cols-[1.7fr_1fr] lg:items-end">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f3c96d]">
                Contact Us
              </h3>
              <ul className="mt-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                {contactItems.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c99b43]/12 text-[#b98227] dark:text-[#f3c96d]">
                      <Icon size={16} />
                    </span>
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-[#c99b43]/20 bg-white/70 p-5 text-sm leading-7 text-slate-600 backdrop-blur-sm dark:bg-white/5 dark:text-slate-300">
              <p className="font-medium text-[#f3c96d]">Smart Rental Solutions</p>
              <p className="mt-2">
                Built around the NX brand palette with a clean gold-on-navy
                footer so it stays aligned with your logo.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Footer Layout */}
        <div className="block lg:hidden">
          {/* Logo & Description & Socials */}
          <div className="max-w-sm">
            <div className="mb-4 flex items-center gap-3">
              <img
                src={currentLogo}
                alt="NX Rent logo"
                className="h-16 w-auto rounded-xl object-contain"
              />
              <span className="text-xl font-semibold tracking-tight text-[#0b2141] dark:text-[#f3c96d]">
                <span className="bg-[linear-gradient(135deg,_#0b2141,_#c99b43)] bg-clip-text text-transparent dark:bg-[linear-gradient(135deg,_#f7db96,_#c99b43)]">
                  {siteName}
                </span>
              </span>
            </div>
            <p className="text-xs leading-6 text-slate-600 dark:text-slate-300">
              {settings?.description || 'Your trusted platform to rent or lease homes, cars, and other assets with a premium, reliable experience.'}
            </p>

            <div className="mt-4 flex items-center gap-2">
              {socialLinks.map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="/"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#c99b43]/30 bg-[#c99b43]/8 text-[#b98227] transition hover:bg-[#c99b43]/12 dark:border-[#c99b43]/35 dark:bg-white/5 dark:text-[#f3c96d]"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#c99b43]/20 to-transparent my-6" />

          {/* Row 1: Company, Properties, Support */}
          <div className="grid grid-cols-3 gap-4">
            {footerSections.slice(0, 3).map((section) => (
              <div key={section.title}>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#f3c96d]">
                  {section.title}
                </h3>
                <ul className="mt-3 space-y-2 text-[10px] text-slate-600 dark:text-slate-300">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a
                        href="/"
                        className="transition hover:text-[#c99b43] dark:hover:text-[#f7d78e]"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#c99b43]/20 to-transparent my-6" />

          {/* Row 2: For Owners, Contact Us, Smart Rental Solutions */}
          <div className="grid grid-cols-3 gap-3 items-start">
            {/* For Owners */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#f3c96d]">
                {footerSections[3].title}
              </h3>
              <ul className="mt-3 space-y-2 text-[10px] text-slate-600 dark:text-slate-300">
                {footerSections[3].links.map((link) => (
                  <li key={link}>
                    <a
                      href="/"
                      className="transition hover:text-[#c99b43] dark:hover:text-[#f7d78e]"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Us */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#f3c96d]">
                Contact Us
              </h3>
              <ul className="mt-3 space-y-2 text-[9px] text-slate-600 dark:text-slate-300">
                {contactItems.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-start gap-1">
                    <Icon size={10} className="mt-0.5 shrink-0 text-[#c99b43]" />
                    <span className="break-all">{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Smart Rental Solutions */}
            <div className="rounded-xl border border-[#c99b43]/20 bg-white/70 p-2.5 text-[9px] leading-normal backdrop-blur-sm dark:bg-white/5 text-slate-600 dark:text-slate-300">
              <p className="font-semibold text-[#f3c96d]">Smart Rental Solutions</p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Built around the NX brand palette with a clean gold-on-navy footer.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[#c99b43]/20 pt-6 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>{settings?.copyright_text || '© 2026 Property Rental System. All rights reserved.'}</p>
          <p className="text-[#d8b15b]">Rent . Lease . Live</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
