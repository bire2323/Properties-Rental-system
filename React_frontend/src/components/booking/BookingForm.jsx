import { AlertCircle, Car, FileText, Home, Info, ShieldCheck, User } from 'lucide-react'
import { Input } from '../ui/input'
import { getMaxDateOfBirth, getMinCheckInDate } from '../../lib/bookingUtils'

const idLabels = {
  national_id: ['National ID Number', 'National ID Photo'],
  passport: ['Passport Number', 'Passport Document'],
  driving_license: ['Driving License Number', 'Driving License Document'],
  business_license: ['Business License Number', 'Business License Document'],
  other: ['ID Number', 'ID Document'],
}

function Section({ icon: Icon, title, children }) {
  return <section className="space-y-4 border-b border-slate-200 pb-7 last:border-0 dark:border-slate-800"><div className="flex items-center gap-2"><Icon className="h-5 w-5 text-[#c99b43]" /><h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2></div>{children}</section>
}

function Field({ label, required = false, error, children, className = '' }) {
  return <label className={`block space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200 ${className}`}><span>{label}{required && <b className="ml-1 text-red-500">*</b>}</span>{children}{error && <span className="block text-xs font-normal text-red-600">{error}</span>}</label>
}

function UploadField({ label, value = [], onChange, error }) {
  return <div><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}<b className="ml-1 text-red-500">*</b></span><div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">{value.map((file, index) => <div key={`${file.name}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"><img src={URL.createObjectURL(file)} alt={`${label} preview ${index + 1}`} className="h-full w-full object-cover" /><button type="button" onClick={() => onChange(value.filter((_, i) => i !== index))} className="absolute right-2 top-2 rounded-full bg-slate-950/75 px-2 py-1 text-xs font-semibold text-white">Remove</button></div>)}<label className={`flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed text-center transition hover:border-[#c99b43] ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}`}><FileText className="h-6 w-6 text-[#c99b43]" /><span className="mt-2 px-2 text-xs text-slate-500 dark:text-slate-400">{value.length ? 'Add another image' : 'Select ID images'}</span><input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => onChange([...value, ...Array.from(event.target.files || [])])} /></label></div>{error && <p className="mt-1 text-xs text-red-600">{error}</p>}<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Select at least 2 images. JPG, PNG, or WebP.</p></div>
}

export default function BookingForm({ form, errors, onChange, user, property }) {
  const isCar = property?.listingType === 'car'
  const [idLabel, documentLabel] = idLabels[form.idType] || idLabels.other
  const inputClass = 'h-11 rounded-xl text-sm'
  const maxDateOfBirth = getMaxDateOfBirth()
  const today = getMinCheckInDate()

  return (
    <div className="space-y-7">
      <Section icon={User} title="Customer Information"><div className="grid gap-4 sm:grid-cols-2"><Field label="Full Name" required error={errors.contactName} className="sm:col-span-2"><Input value={form.contactName} onChange={(event) => onChange({ contactName: event.target.value })} placeholder={user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Your full name'} className={inputClass} /></Field><Field label="Phone Number" required error={errors.contactPhone}><Input type="tel" value={form.contactPhone} onChange={(event) => onChange({ contactPhone: event.target.value })} placeholder="+251 9XX XXX XXX or 09XXXXXXXX" className={inputClass} /></Field><Field label="Email" required error={errors.contactEmail}><Input type="email" value={form.contactEmail} onChange={(event) => onChange({ contactEmail: event.target.value })} placeholder={user?.email || 'you@example.com'} className={inputClass} /></Field><Field label="Date of Birth" required error={errors.dateOfBirth}><Input type="date" value={form.dateOfBirth} max={maxDateOfBirth} onChange={(event) => onChange({ dateOfBirth: event.target.value })} className={inputClass} /></Field><Field label="Gender" required error={errors.gender}><select value={form.gender} onChange={(event) => onChange({ gender: event.target.value })} className={`${inputClass} w-full border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900`}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></Field></div></Section>

      <Section icon={ShieldCheck} title="Identification"><div className="grid gap-4 sm:grid-cols-2"><Field label="ID Type" required error={errors.idType} className="sm:col-span-2"><select value={form.idType} onChange={(event) => onChange({ idType: event.target.value, idNumber: '', idDocuments: [] })} className={`${inputClass} w-full border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900`}><option value="national_id">National ID</option><option value="passport">Passport</option><option value="driving_license">Driving License</option><option value="business_license">Business License</option><option value="other">Other</option></select></Field><Field label={idLabel} required error={errors.idNumber} className="sm:col-span-2"><Input value={form.idNumber} onChange={(event) => onChange({ idNumber: event.target.value })} className={inputClass} /></Field><div className="sm:col-span-2"><UploadField label={documentLabel} value={form.idDocuments} onChange={(docs) => onChange({ idDocuments: docs })} error={errors.idDocuments} /></div></div></Section>

      <Section icon={User} title="Emergency Contact"><div className="grid gap-4 sm:grid-cols-2"><Field label="Emergency Contact Name" required error={errors.emergencyName}><Input value={form.emergencyName} onChange={(event) => onChange({ emergencyName: event.target.value })} className={inputClass} /></Field><Field label="Emergency Contact Phone" required error={errors.emergencyPhone}><Input type="tel" value={form.emergencyPhone} onChange={(event) => onChange({ emergencyPhone: event.target.value })} className={inputClass} /></Field><Field label="Relationship to Customer" required error={errors.emergencyRelationship} className="sm:col-span-2"><Input value={form.emergencyRelationship} onChange={(event) => onChange({ emergencyRelationship: event.target.value })} placeholder="Parent, spouse, friend..." className={inputClass} /></Field></div></Section>

      <Section icon={isCar ? Car : Home} title={isCar ? 'Car Rental Details' : 'House Rental Details'}>
        {isCar ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pickup Date" required error={errors.checkIn}><Input type="date" value={form.checkIn} min={today} onChange={(event) => onChange({ checkIn: event.target.value })} className={inputClass} /></Field>
            <Field label="Pickup Time" required error={errors.pickupTime}><Input type="time" value={form.pickupTime} onChange={(event) => onChange({ pickupTime: event.target.value })} className={inputClass} /></Field>
            <Field label="Return Date" required error={errors.checkOut}><Input type="date" value={form.checkOut} min={form.checkIn || today} onChange={(event) => onChange({ checkOut: event.target.value })} className={inputClass} /></Field>
            <Field label="Return Time" required error={errors.returnTime}><Input type="time" value={form.returnTime} onChange={(event) => onChange({ returnTime: event.target.value })} className={inputClass} /></Field>
            <Field label="Rental Purpose" required error={errors.pickupPurpose} className="sm:col-span-2"><select value={form.pickupPurpose} onChange={(event) => onChange({ pickupPurpose: event.target.value })} className={`${inputClass} w-full border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900`}><option value="personal">Personal</option><option value="business">Business</option><option value="travel">Travel</option><option value="other">Other</option></select></Field>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rental Type" required error={errors.rentalType} className="sm:col-span-2">
              <select value={form.rentalType || 'fixed_term'} onChange={(event) => onChange({ rentalType: event.target.value })} className={`${inputClass} w-full border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900`}>
                <option value="fixed_term">Fixed Term</option>
                <option value="month_to_month">Month to Month</option>
              </select>
            </Field>
            <Field label="Move-in Date" required error={errors.moveInDate}><Input type="date" value={form.moveInDate} min={today} onChange={(event) => onChange({ moveInDate: event.target.value })} className={inputClass} /></Field>
            <Field label="Number of Tenants" required error={errors.numberOfTenants}><Input type="number" min="1" value={form.numberOfTenants} onChange={(event) => onChange({ numberOfTenants: event.target.value })} className={inputClass} /></Field>
            {form.rentalType !== 'month_to_month' && (
              <>
                <Field label="Rental Duration" required error={errors.rentalDuration}><Input type="number" min="1" value={form.rentalDuration} onChange={(event) => onChange({ rentalDuration: event.target.value })} className={inputClass} /></Field>
                <Field label="Duration Unit" required error={errors.durationUnit}><select value={form.durationUnit} onChange={(event) => onChange({ durationUnit: event.target.value })} className={`${inputClass} w-full border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900`}><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option><option value="year">Year</option></select></Field>
              </>
            )}
          </div>
        )}
      </Section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50"><div className="flex gap-3"><Info className="mt-0.5 h-5 w-5 shrink-0 text-[#c99b43]" /><p className="text-sm text-slate-600 dark:text-slate-400">Your selected listing details are loaded automatically and cannot be changed here.</p></div><label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={form.informationConfirmed} onChange={(event) => onChange({ informationConfirmed: event.target.checked })} className="mt-1 accent-[#c99b43]" />I confirm that all information I provided is correct.</label><label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={form.termsAccepted} onChange={(event) => onChange({ termsAccepted: event.target.checked })} className="mt-1 accent-[#c99b43]" />I agree to the <button type="button" className="font-semibold text-[#a77a28] underline">rental terms and conditions</button>.</label>{errors.terms && <p className="text-xs text-red-600">{errors.terms}</p>}</section>

      {errors.general && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}
    </div>
  )
}
