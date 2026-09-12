import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Quote, Star, BadgeCheck } from 'lucide-react'
import { getTestimonials } from '../../api/property/propertyApi'
import { getImageUrl } from '../../lib/utils'

// --- Ultra-smooth spring config ---
const springConfig = {
    type: 'spring',
    stiffness: 180,
    damping: 28,
    mass: 1.0,
    restDelta: 0.001,
    restSpeed: 0.001,
}

// --- Main Component ---
export default function Testimonials() {
    const [testimonials, setTestimonials] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isHovering, setIsHovering] = useState(false)
    const totalSlides = testimonials.length

    useEffect(() => {
        let cancelled = false

        getTestimonials()
            .then((data) => {
                if (cancelled) return
                const items = Array.isArray(data) ? data : (data?.results || [])
                setTestimonials(items.map((item) => ({
                    ...item,
                    name: item.name || 'NexaSpace customer',
                    role: item.role || item.property_name || 'Happy customer',
                    image: getImageUrl(item.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Customer')}&background=c99b43&color=fff`,
                    text: item.text,
                    rating: item.rating ?? null,
                    isVerified: Boolean(item.is_verified_renter),
                    propertyName: item.property_name || '',
                })))
            })
            .catch(() => {
                if (!cancelled) setTestimonials([])
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false)
            })

        return () => { cancelled = true }
    }, [])

    // Auto-scroll (paused on hover)
    useEffect(() => {
        if (isHovering || totalSlides < 2) return
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % totalSlides)
        }, 5000)
        return () => clearInterval(interval)
    }, [totalSlides, isHovering])

    const handleNext = () => {
        if (!totalSlides) return
        setCurrentIndex((prev) => (prev + 1) % totalSlides)
    }

    const handlePrev = () => {
        if (!totalSlides) return
        setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides)
    }

    const goToSlide = (index) => {
        setCurrentIndex(index)
    }

    if (isLoading) {
        return (
            <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
                <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl">
                        <div className="text-center">
                            <div className="mx-auto h-9 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                            <div className="mx-auto mt-4 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                        </div>
                        <div className="mx-auto mt-12 h-[280px] sm:h-[320px] md:h-[350px] lg:h-[380px] animate-pulse rounded-xl border bg-white/60 dark:bg-slate-900/60" />
                    </div>
                </div>
            </section>
        )
    }

    if (!testimonials.length) return null

    // Calculate position: 0 = front (active), 1,2,3,4 = behind
    const getCardPosition = (cardIndex) => {
        let offset = cardIndex - currentIndex
        if (offset < 0) offset += totalSlides
        return offset
    }

    // Get Y offset for each position - larger cards mean larger gaps
    const getYOffset = (position) => {
        // Active card at the bottom (y=70), others stacked above with 16px gaps
        return 70 - position * 16
    }

    // Calculate card state based on position
    const getCardState = (position) => {
        const isActive = position === 0
        return {
            y: getYOffset(position),
            scale: isActive ? 1 : 1 - position * 0.02,
            opacity: isActive ? 1 : 1 - position * 0.07,
            zIndex: isActive ? 10 : 10 - position,
            pointerEvents: isActive ? 'auto' : 'none',
        }
    }

    return (
        <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
                        What Our{' '}
                        <span className="bg-gradient-to-r from-[#f3c96d] to-[#c99b43] bg-clip-text text-transparent">
                            Clients Say
                        </span>
                    </h2>
                    <p className="mt-3 text-base text-slate-600 dark:text-slate-400 sm:text-lg">
                        Real stories from real people who found their perfect space.
                    </p>
                </div>

                {/* Carousel Container */}
                <div
                    className="relative mx-auto mt-12 max-w-2xl lg:mt-16"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                >
                    {/* Card Container – larger height */}
                    <div className="relative h-[280px] sm:h-[320px] md:h-[350px] lg:h-[380px]">
                        {testimonials.map((testimonial, index) => {
                            const position = getCardPosition(index)
                            const state = getCardState(position)
                            const isActive = position === 0

                            return (
                                <motion.div
                                    key={testimonial.id}
                                    className="absolute inset-x-0"
                                    animate={{
                                        y: state.y,
                                        scale: state.scale,
                                        opacity: state.opacity,
                                        zIndex: state.zIndex,
                                    }}
                                    transition={springConfig}
                                    style={{
                                        transformOrigin: 'center bottom',
                                        pointerEvents: state.pointerEvents,
                                    }}
                                >
                                    <div
                                        className={`rounded-xl border p-5 shadow-lg backdrop-blur-sm transition-colors duration-200 sm:p-6 md:p-7 ${isActive
                                            ? 'border-slate-200 bg-white/95 shadow-2xl dark:border-slate-700 dark:bg-slate-900/95'
                                            : 'border-slate-200/50 bg-white/60 dark:border-slate-800/50 dark:bg-slate-900/60'
                                            }`}
                                    >
                                        <div className="flex flex-col items-center justify-center text-center">
                                            {/* Quote Icon */}
                                            <Quote
                                                className={`mb-2 ${isActive
                                                    ? 'h-7 w-7 text-[#c99b43] sm:h-8 sm:w-8'
                                                    : 'h-5 w-5 text-slate-400'
                                                    }`}
                                            />

                                            {/* Testimonial Text – larger */}
                                            <p
                                                className={`leading-relaxed ${isActive
                                                    ? 'text-sm text-slate-700 dark:text-slate-300 sm:text-base md:text-lg'
                                                    : 'text-xs text-slate-500 dark:text-slate-500'
                                                    }`}
                                            >
                                                "{testimonial.text}"
                                            </p>

                                            {/* Star Rating */}
                                            {testimonial.rating > 0 && (
                                                <div className={`mt-2 flex items-center justify-center gap-0.5 ${isActive ? '' : 'opacity-50'}`}>
                                                    {[1, 2, 3, 4, 5].map((value) => (
                                                        <Star
                                                            key={value}
                                                            className={`h-4 w-4 ${value <= testimonial.rating
                                                                ? 'fill-amber-400 text-amber-400'
                                                                : 'text-slate-300 dark:text-slate-600'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {/* Avatar & Name – larger */}
                                            <div className="mt-4 flex items-center gap-3">
                                                <img
                                                    src={testimonial.image}
                                                    alt={testimonial.name}
                                                    className={`rounded-full object-cover ${isActive
                                                        ? 'h-11 w-11 ring-2 ring-[#c99b43]/30 sm:h-12 sm:w-12'
                                                        : 'h-8 w-8 ring-1 ring-slate-300/30 dark:ring-slate-700/30'
                                                        }`}
                                                />
                                                <div className="text-left">
                                                    <div className="flex items-center gap-1.5">
                                                        <p
                                                            className={`font-semibold ${isActive
                                                                ? 'text-sm text-slate-900 dark:text-white sm:text-base'
                                                                : 'text-xs text-slate-600 dark:text-slate-400'
                                                                }`}
                                                        >
                                                            {testimonial.name}
                                                        </p>
                                                        {testimonial.isVerified && isActive && (
                                                            <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                                                <BadgeCheck className="h-3 w-3" /> Verified
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p
                                                        className={`${isActive
                                                            ? 'text-xs text-slate-500 dark:text-slate-400 sm:text-sm'
                                                            : 'text-[10px] text-slate-400 dark:text-slate-500'
                                                            }`}
                                                    >
                                                        {testimonial.role}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Navigation Buttons */}
                    <button
                        onClick={handlePrev}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 rounded-full bg-white/90 p-2.5 shadow-lg backdrop-blur-sm transition hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 sm:-translate-x-6 sm:p-3"
                        aria-label="Previous"
                    >
                        <ChevronLeft className="h-4 w-4 text-slate-700 dark:text-slate-300 sm:h-5 sm:w-5" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 rounded-full bg-white/90 p-2.5 shadow-lg backdrop-blur-sm transition hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 sm:translate-x-6 sm:p-3"
                        aria-label="Next"
                    >
                        <ChevronRight className="h-4 w-4 text-slate-700 dark:text-slate-300 sm:h-5 sm:w-5" />
                    </button>
                </div>

                {/* Dots Indicator */}
                <div className="mt-8 flex justify-center gap-2">
                    {testimonials.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                ? 'w-8 bg-[#c99b43]'
                                : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600'
                                }`}
                            aria-label={`Go to testimonial ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}