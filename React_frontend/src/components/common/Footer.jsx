import { Building2, Globe, Mail, MapPin, Phone, Send } from 'lucide-react'
import logo from '../../assets/logo.jpg'

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
  return (
    <footer className="relative overflow-hidden border-t border-[#c99b43]/20 bg-[radial-gradient(circle_at_top,_rgba(205,160,69,0.12),_transparent_28%),linear-gradient(180deg,_#fffdf8_0%,_#f8fbff_100%)] text-slate-900 dark:border-[#c99b43]/30 dark:bg-[radial-gradient(circle_at_top,_rgba(205,160,69,0.18),_transparent_32%),linear-gradient(135deg,_#031226_0%,_#07244a_45%,_#031226_100%)] dark:text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f3c96d] to-transparent" />

      <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-10 border-b border-[#c99b43]/20 pb-10 lg:grid-cols-[1.25fr_repeat(4,0.8fr)] dark:border-[#c99b43]/20">
          <div className="max-w-sm">
            <div className="mb-5 flex items-center gap-3">
              <img
                src={logo}
                alt="NX Rent logo"
                className="h-20 w-auto rounded-2xl object-contain"
              />
              <span className="text-2xl font-semibold tracking-tight text-[#0b2141] dark:text-[#f3c96d]">
                <span className="bg-[linear-gradient(135deg,_#0b2141,_#c99b43)] bg-clip-text text-transparent dark:bg-[linear-gradient(135deg,_#f7db96,_#c99b43)]">
                  NexaSpace
                </span>
              </span>
            </div>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              NX is your trusted platform to rent or lease homes, cars, and
              other assets with a premium, reliable experience.
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

        <div className="mt-8 flex flex-col gap-3 border-t border-[#c99b43]/20 pt-6 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2025 NX Rental System. All rights reserved.</p>
          <p className="text-[#d8b15b]">Rent . Lease . Live</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
