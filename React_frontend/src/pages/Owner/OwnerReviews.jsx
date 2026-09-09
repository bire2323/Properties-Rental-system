import { useEffect, useState } from 'react'
import { CalendarDays, MessageSquareQuote, Star, UserRound } from 'lucide-react'
import { getOwnerReviews } from '../../api/property/propertyApi'
import { getImageUrl } from '../../lib/utils'

function ReviewCard({ review }) {
    const profileImage = getImageUrl(review.profile_image)
    const initials = (review.user_name || 'Tenant')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    const propertyImage = getImageUrl(review.property_image)

    return (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#c99b43]/15 font-bold text-[#a87925]">
                        {profileImage ? <img src={profileImage} alt={review.user_name} className="h-full w-full object-cover" /> : initials}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900 dark:text-white">{review.user_name || 'Tenant'}</p>
                        <p className="truncate text-xs text-slate-500">{review.user_email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Recently'}
                </div>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/60">
                <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">“{review.review_text}”</p>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="h-9 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                        {propertyImage ? <img src={propertyImage} alt={review.property_name || 'Property'} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800" />}
                    </div>
                    <p className="truncate text-xs font-semibold text-[#a87925] dark:text-[#f3c96d]">{review.property_name || 'Your property'}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold capitalize text-slate-500 dark:bg-slate-800 dark:text-slate-400">{review.listing_type || 'listing'}</span>
            </div>
        </article>
    )
}

export default function OwnerReviews() {
    const [reviews, setReviews] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [visibleCount, setVisibleCount] = useState(5)

    useEffect(() => {
        let active = true
        getOwnerReviews()
            .then((data) => {
                if (!active) return
                const reviews = Array.isArray(data) ? data : data?.results || []
                setReviews(reviews)
            })
            .catch((err) => {
                if (active) setError(err.message || 'Unable to load tenant reviews.')
            })
            .finally(() => {
                if (active) setIsLoading(false)
            })
        return () => { active = false }
    }, [])

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#102b40] via-[#255070] to-[#c99b43] p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
                <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[24px] border-white/10" />
                <div className="relative flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"><MessageSquareQuote className="h-7 w-7" /></div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">Owner feedback</p>
                        <h1 className="mt-1 text-3xl font-bold">Reviews</h1>
                        <p className="mt-2 text-sm text-white/75">Written reviews for your properties and vehicles.</p>
                    </div>
                </div>
            </section>

            {isLoading && <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c99b43] border-t-transparent" /></div>}
            {!isLoading && error && <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">{error}</div>}
            {!isLoading && !error && !reviews.length && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
                    <Star className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">No reviews yet</h2>
                    <p className="mt-2 text-sm text-slate-500">Reviews for your properties and vehicles will appear here.</p>
                </div>
            )}
            {!isLoading && !error && reviews.length > 0 && (
                <>
                    <div className="mx-auto grid max-w-3xl gap-4">{reviews.slice(0, visibleCount).map((review) => <ReviewCard key={review.id} review={review} />)}</div>
                    <div className="flex justify-center gap-3 pt-2">
                        {visibleCount < reviews.length && (
                            <button type="button" onClick={() => setVisibleCount((count) => Math.min(count + 5, reviews.length))} className="rounded-full bg-[#c99b43] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#b48738]">
                                View more
                            </button>
                        )}
                        {visibleCount > 5 && (
                            <button type="button" onClick={() => setVisibleCount(5)} className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:border-[#c99b43] hover:text-[#a87925] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                View less
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
