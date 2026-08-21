// frontend/src/components/ContactButtons.jsx
import { useState, useEffect, useRef } from 'react';

export default function ContactButtons({ name, phone, label }) {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [actionTooltip, setActionTooltip] = useState({ visible: false, text: '' });
    const [desktopCallVisible, setDesktopCallVisible] = useState(false);
    const [copied, setCopied] = useState(false);
    const containerRef = useRef(null);

    // Handle responsive check
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle click outside to dismiss desktop popover
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setDesktopCallVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!phone) {
        return (
            <div className="mt-2">
                {label && <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>}
                <span className="text-xs text-gray-400">No contact number available</span>
            </div>
        );
    }

    const handleCallClick = (e) => {
        e.preventDefault();
        if (!isMobile) {
            setDesktopCallVisible((prev) => !prev);
            return;
        }

        // Mobile behavior
        setActionTooltip({ visible: true, text: `Calling ${name} on ${phone}` });
        setTimeout(() => {
            setActionTooltip({ visible: false, text: '' });
            window.location.href = `tel:${phone}`;
        }, 1500);
    };

    const handleWhatsAppClick = (e) => {
        e.preventDefault();
        setActionTooltip({ visible: true, text: `Opening WhatsApp for ${name}` });
        setTimeout(() => {
            setActionTooltip({ visible: false, text: '' });
            const waNumber = phone.replace('+', '');
            window.open(`https://wa.me/${waNumber}`, '_blank');
        }, 1500);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(phone);
        setCopied(true);
        setTimeout(() => setCopied(false), 500);
    };

    return (
        <div className="mt-2 relative flex flex-col items-start" ref={containerRef}>
            {label && <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>}

            <div className="flex gap-2 relative">
                {/* Inline Action Confirmation Tooltip */}
                {actionTooltip.visible && (
                    <div className="absolute -top-10 left-0 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-md whitespace-nowrap z-20 shadow-lg transition-opacity">
                        {actionTooltip.text}
                    </div>
                )}

                {/* Call Button */}
                <a
                    href={`tel:${phone}`}
                    onClick={handleCallClick}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-sm font-semibold transition"
                >
                    <span>📞</span> Call
                </a>

                {/* WhatsApp Button */}
                <button
                    onClick={handleWhatsAppClick}
                    className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-1.5 rounded-md text-sm font-semibold transition"
                >
                    <span>💬</span> WhatsApp
                </button>

                {/* Desktop Call Information Popover */}
                {desktopCallVisible && !isMobile && (
                    <div className="absolute top-10 left-0 bg-white border border-gray-200 shadow-xl rounded-md p-3 z-30 flex items-center gap-4 min-w-[240px]">
                        <span className="text-lg font-medium text-gray-800 tracking-wide">📞 {phone}</span>
                        <button
                            onClick={handleCopy}
                            className="ml-auto bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-md font-medium transition"
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}