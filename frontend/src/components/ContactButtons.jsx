import { useState, useEffect, useRef } from 'react'

export default function ContactButtons({ name, phone, label }) {

    // Normalize Sri Lankan phone numbers
    const normalizePhone = (rawPhone) => {
        if (!rawPhone) return null

        const cleaned = rawPhone.trim()

        // 0701234567 -> +94701234567
        if (cleaned.startsWith('0')) {
            return '+94' + cleaned.slice(1)
        }

        // 94701234567 -> +94701234567
        if (cleaned.startsWith('94') && !cleaned.startsWith('+')) {
            return '+' + cleaned
        }

        return cleaned
    }

    const normalizedPhone = normalizePhone(phone)

    const [tooltip, setTooltip] = useState(null)
    const [showDesktopCard, setShowDesktopCard] = useState(false)
    const [copied, setCopied] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const cardRef = useRef(null)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Close desktop card when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (cardRef.current && !cardRef.current.contains(e.target)) {
                setShowDesktopCard(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Use normalized number for validation
    if (!normalizedPhone) {
        return (
            <p className="text-xs text-gray-400 mt-2">
                No contact number available
            </p>
        )
    }

    // Remove + for WhatsApp wa.me URL
    const whatsappNumber = normalizedPhone.replace('+', '')

    const handleCallClick = () => {
        if (isMobile) {
            setTooltip('call')

            setTimeout(() => {
                setTooltip(null)
                window.location.href = `tel:${normalizedPhone}`
            }, 1500)
        } else {
            setShowDesktopCard(prev => !prev)
        }
    }

    const handleWhatsAppClick = () => {
        setTooltip('whatsapp')

        setTimeout(() => {
            setTooltip(null)
            window.open(`https://wa.me/${whatsappNumber}`, '_blank')
        }, 1500)
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(normalizedPhone)
        setCopied(true)

        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="mt-3">

            {label && (
                <p className="text-xs font-medium text-gray-500 mb-2">
                    {label}
                </p>
            )}

            {/* Tooltip for mobile */}
            {tooltip && (
                <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-md mb-2 inline-block">
                    {tooltip === 'call'
                        ? `📞 Calling ${name} on ${normalizedPhone}...`
                        : `💬 Opening WhatsApp for ${name}...`}
                </div>
            )}

            {/* Desktop number card */}
            {showDesktopCard && !isMobile && (
                <div
                    ref={cardRef}
                    className="bg-gray-50 border border-gray-200 rounded-md px-4 py-3 mb-2 flex items-center gap-3"
                >
                    <span className="text-gray-800 font-semibold text-sm">
                        📞 {normalizedPhone}
                    </span>

                    <button
                        onClick={handleCopy}
                        className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded transition"
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={handleCallClick}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1.5 rounded-md transition"
                >
                    📞 Call
                </button>

                <button
                    onClick={handleWhatsAppClick}
                    className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1.5 rounded-md transition"
                >
                    💬 WhatsApp
                </button>
            </div>
        </div>
    )
}