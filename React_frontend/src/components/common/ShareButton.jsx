import { useState, useRef, useEffect } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import { Button } from '../ui/button'

const FacebookIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
)

const TwitterXIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
)

const TelegramIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.14.121.098.155.23.171.325.016.095.035.313.02.485z" />
    </svg>
)

const ShareButton = ({ propertyId, title }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const containerRef = useRef(null)

    const baseUrl = import.meta.env?.VITE_SITE_URL || window.location.origin
    const shareUrl = `${baseUrl}/properties/${propertyId}`
    const shareText = `Check out ${title} on NexaSpace!`

    // Close dropdown when clicking anywhere outside containerRef
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const toggleDropdown = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsOpen((prev) => !prev)
    }

    const handleCopyLink = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            const textArea = document.createElement('textarea')
            textArea.value = shareUrl
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
        setIsOpen(false)
    }

    const handleNativeShare = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Check out ${title} on NexaSpace`,
                    text: `Looking for a property? Check out this ${title}!`,
                    url: shareUrl,
                })
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Share failed:', error)
                }
            }
        } else {
            handleCopyLink(e)
        }
        setIsOpen(false)
    }

    const handleSocialShare = (e, shareLink) => {
        e.preventDefault()
        e.stopPropagation()
        window.open(shareLink, '_blank', 'noopener,noreferrer,width=600,height=500')
        setIsOpen(false)
    }

    return (
        <div ref={containerRef} className="relative inline-block text-left">
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggleDropdown}
                aria-label="Share property"
            >
                <Share2 className="h-5 w-5" />
                {copied && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                    </span>
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900 z-[9999]">
                    <button
                        type="button"
                        onClick={handleCopyLink}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        {copied ? (
                            <>
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-green-500">Link copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4" />
                                <span>Copy link</span>
                            </>
                        )}
                    </button>

                    {navigator.share && (
                        <button
                            type="button"
                            onClick={handleNativeShare}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            <Share2 className="h-4 w-4" />
                            <span>Share via...</span>
                        </button>
                    )}

                    <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                    <div className="px-2 py-1">
                        <p className="px-2 text-xs text-slate-500 dark:text-slate-400">Share on social</p>
                    </div>

                    {/* Facebook */}
                    <button
                        type="button"
                        onClick={(e) => handleSocialShare(e, `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <FacebookIcon className="h-4 w-4 text-[#1877f2]" />
                        <span>Facebook</span>
                    </button>

                    {/* Twitter / X */}
                    <button
                        type="button"
                        onClick={(e) => handleSocialShare(e, `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <TwitterXIcon className="h-4 w-4 text-[#1da1f2]" />
                        <span>Twitter / X</span>
                    </button>

                    {/* Telegram */}
                    <button
                        type="button"
                        onClick={(e) => handleSocialShare(e, `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <TelegramIcon className="h-4 w-4 text-[#229ED9]" />
                        <span>Telegram</span>
                    </button>
                </div>
            )}
        </div>
    )
}

export default ShareButton