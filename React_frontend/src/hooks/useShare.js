// src/hooks/useShare.js
import { useState } from 'react'

export const useShare = () => {
    const [copied, setCopied] = useState(false)

    const generateShareUrl = (propertyId) => {
        return `${window.location.origin}/properties/${propertyId}`
    }

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            return true
        } catch {
            // Fallback
            const textArea = document.createElement('textarea')
            textArea.value = text
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            return true
        }
    }

    const shareNative = async (data) => {
        if (navigator.share) {
            try {
                await navigator.share(data)
                return true
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Share failed:', error)
                }
                return false
            }
        }
        return false
    }

    return {
        generateShareUrl,
        copyToClipboard,
        shareNative,
        copied,
    }
}