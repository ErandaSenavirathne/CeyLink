import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import SEO from '../components/SEO'

export default function Landing() {
    const { t, i18n } = useTranslation()
    const [menuOpen, setMenuOpen] = useState(false)

    const languages = [
        { code: 'en', label: 'EN' },
        { code: 'si', label: 'සිං' },
        { code: 'ta', label: 'தமி' }
    ]

    const features = [
        { icon: '✓', title: t('landing.why.f1Title'), desc: t('landing.why.f1Desc') },
        { icon: '💬', title: t('landing.why.f2Title'), desc: t('landing.why.f2Desc') },
        { icon: '🇱🇰', title: t('landing.why.f3Title'), desc: t('landing.why.f3Desc') },
        { icon: '💵', title: t('landing.why.f4Title'), desc: t('landing.why.f4Desc') },
        { icon: '📍', title: t('landing.why.f5Title'), desc: t('landing.why.f5Desc') },
        { icon: '⭐', title: t('landing.why.f6Title'), desc: t('landing.why.f6Desc') }
    ]

    const steps = [
        { icon: '🔍', title: t('landing.how.step1Title'), desc: t('landing.how.step1Desc') },
        { icon: '📅', title: t('landing.how.step2Title'), desc: t('landing.how.step2Desc') },
        { icon: '✅', title: t('landing.how.step3Title'), desc: t('landing.how.step3Desc') }
    ]

    const services = [
        { icon: '🚿', label: t('landing.categories.plumbing') },
        { icon: '⚡', label: t('landing.categories.electrical') },
        { icon: '🪚', label: t('landing.categories.carpentry') },
        { icon: '🎨', label: t('landing.categories.painting') },
        { icon: '🧹', label: t('landing.categories.cleaning') },
        { icon: '📚', label: t('landing.categories.tutoring') },
        { icon: '💇', label: t('landing.categories.beauty') },
        { icon: '🌿', label: t('landing.categories.gardening') },
        { icon: '❄️', label: t('landing.categories.acRepair') },
        { icon: '🛠️', label: t('landing.categories.andMore') }
    ]

    return (
        <div className="min-h-screen flex flex-col font-sans">
            <SEO 
                title="CeyLink | Find Local Service Providers in Sri Lanka"
                description="Connect with trusted plumbers, electricians, tutors, and more across Sri Lanka."
            />

            {/* ── NAVBAR ──────────────────────────────────────────────── */}
            <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">

                    {/* Logo */}
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer">
                        <span className="text-2xl font-bold text-primary">CeyLink</span>
                        <span className="text-xl">🇱🇰</span>
                    </button>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* Language switcher */}
                        <div className="flex gap-1 bg-gray-100 rounded-md p-1">
                            {languages.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => i18n.changeLanguage(lang.code)}
                                    className={`text-xs px-2 py-1 rounded transition ${i18n.language === lang.code
                                        ? 'bg-primary text-white'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                        <Link
                            to="/login"
                            className="text-sm text-gray-600 hover:text-primary font-medium transition"
                        >
                            {t('landing.nav.login')}
                        </Link>
                        <Link
                            to="/register"
                            className="text-sm bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-900 transition"
                        >
                            {t('landing.nav.register')}
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden text-gray-600"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        {menuOpen ? '✕' : '☰'}
                    </button>
                </div>

                {/* Mobile menu dropdown */}
                {menuOpen && (
                    <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3">
                        <div className="flex gap-1 bg-gray-100 rounded-md p-1 w-fit">
                            {languages.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => i18n.changeLanguage(lang.code)}
                                    className={`text-xs px-2 py-1 rounded transition ${i18n.language === lang.code
                                        ? 'bg-primary text-white'
                                        : 'text-gray-500'
                                        }`}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                        <Link
                            to="/login"
                            className="text-sm text-gray-600 font-medium"
                            onClick={() => setMenuOpen(false)}
                        >
                            {t('landing.nav.login')}
                        </Link>
                        <Link
                            to="/register"
                            className="text-sm bg-primary text-white px-4 py-2 rounded-lg font-semibold text-center"
                            onClick={() => setMenuOpen(false)}
                        >
                            {t('landing.nav.register')}
                        </Link>
                    </div>
                )}
            </nav>

            {/* ── HERO SECTION ────────────────────────────────────────── */}
            <section className="bg-gradient-to-br from-primary via-blue-700 to-blue-500 text-white">
                <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 text-center">
                    <div className="inline-block bg-white/10 rounded-full px-4 py-1 text-sm mb-6 backdrop-blur-sm">
                        {t('landing.hero.badge')}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                        {t('landing.hero.titlePart1')}
                        <br />
                        <span className="text-accent">{t('landing.hero.titlePart2')}</span>
                    </h1>

                    <p className="text-blue-100 text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
                        {t('landing.hero.desc')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
                        <Link
                            to="/register"
                            className="bg-accent text-white px-8 py-3 rounded-xl font-bold text-base hover:bg-teal-500 transition shadow-lg text-center flex-1 sm:flex-none flex items-center justify-center"
                        >
                            {t('landing.hero.findService')}
                        </Link>
                        <Link
                            to="/register"
                            state={{ role: 'PROVIDER' }}
                            className="bg-white/10 backdrop-blur-sm text-white border border-white/30 px-8 py-3 rounded-xl font-bold text-base hover:bg-white/20 transition text-center flex-1 sm:flex-none flex items-center justify-center"
                        >
                            {t('landing.hero.joinProvider')}
                        </Link>
                    </div>

                    {/* Trust badges */}
                    <div className="flex flex-wrap justify-center gap-6 text-sm text-blue-100">
                        <span>{t('landing.trust.verified')}</span>
                        <span>{t('landing.trust.support')}</span>
                        <span>{t('landing.trust.whatsapp')}</span>
                        <span>{t('landing.trust.payment')}</span>
                    </div>
                </div>

                {/* Wave divider */}
                <div className="w-full overflow-hidden leading-none">
                    <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H0Z" fill="#F9FAFB" />
                    </svg>
                </div>
            </section>

            {/* ── SERVICE CATEGORIES ──────────────────────────────────── */}
            <section className="bg-gray-50 py-12">
                <div className="max-w-6xl mx-auto px-4">
                    <p className="text-center text-gray-500 text-sm font-medium mb-6 uppercase tracking-wide">
                        {t('landing.categories.title')}
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {services.map(service => (
                            <div
                                key={service.label}
                                className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 shadow-sm hover:border-primary hover:text-primary transition cursor-default"
                            >
                                <span>{service.icon}</span>
                                <span className="font-medium">{service.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ────────────────────────────────────────── */}
            <section className="py-16 bg-white">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                            {t('landing.how.title')}
                        </h2>
                        <p className="text-gray-500 max-w-xl mx-auto">
                            {t('landing.how.desc')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((step, index) => (
                            <div key={step.title} className="text-center relative h-full flex flex-col">
                                {/* Connector line between steps on desktop */}
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-100 z-0" />
                                )}
                                <div className="relative z-10 flex flex-col flex-1 items-center">
                                    <div className="w-16 h-16 shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                                        {step.icon}
                                    </div>
                                    <div className="bg-primary text-white text-xs font-bold w-6 h-6 shrink-0 rounded-full flex items-center justify-center mx-auto -mt-2 mb-3">
                                        {index + 1}
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-lg mb-2">{step.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed flex-1">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-10">
                        <Link
                            to="/register"
                            className="bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-900 transition inline-block"
                        >
                            {t('landing.how.cta')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── WHY CEYLINK ─────────────────────────────────────────── */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                            {t('landing.why.title')}
                        </h2>
                        <p className="text-gray-500 max-w-xl mx-auto">
                            {t('landing.why.desc')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {features.map(feature => (
                            <div
                                key={feature.title}
                                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border border-gray-100 h-full flex flex-col"
                            >
                                <div className="text-3xl mb-3 shrink-0">{feature.icon}</div>
                                <h3 className="font-bold text-gray-800 mb-2 shrink-0">{feature.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed flex-1">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── DISTRICT COVERAGE ───────────────────────────────────── */}
            <section className="py-16 bg-white">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                        {t('landing.coverage.title')}
                    </h2>
                    <p className="text-gray-500 max-w-xl mx-auto mb-8">
                        {t('landing.coverage.desc')}
                    </p>

                    <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
                        {[
                            'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale',
                            'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna',
                            'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa',
                            'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura',
                            'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle'
                        ].map(district => (
                            <span
                                key={district}
                                className="bg-primary/5 text-primary text-xs px-3 py-1 rounded-full border border-primary/20 font-medium"
                            >
                                {t(`districts.${district}`, district)}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PROVIDER CTA ────────────────────────────────────────── */}
            <section className="py-16 bg-gradient-to-r from-accent to-teal-500 text-white">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-3">
                                {t('landing.providerCta.title')}
                            </h2>
                            <p className="text-teal-50 max-w-lg leading-relaxed">
                                {t('landing.providerCta.desc')}
                            </p>
                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-teal-100">
                                <span>{t('landing.providerCta.p1')}</span>
                                <span>{t('landing.providerCta.p2')}</span>
                                <span>{t('landing.providerCta.p3')}</span>
                                <span>{t('landing.providerCta.p4')}</span>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <Link
                                to="/register"
                                state={{ role: 'PROVIDER' }}
                                className="bg-white text-accent font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition shadow-lg inline-block text-center"
                            >
                                {t('landing.providerCta.btn')}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── STATS SECTION ───────────────────────────────────────── */}
            <section className="py-12 bg-primary text-white">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        {[
                            { value: '25', label: t('landing.stats.districts') },
                            { value: '3', label: t('landing.stats.languages') },
                            { value: '10+', label: t('landing.stats.categories') },
                            { value: '100%', label: t('landing.stats.verified') },
                        ].map(stat => (
                            <div key={stat.label}>
                                <p className="text-3xl md:text-4xl font-bold text-accent mb-1">
                                    {stat.value}
                                </p>
                                <p className="text-blue-200 text-sm">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FINAL CTA ───────────────────────────────────────────── */}
            <section className="py-16 bg-white text-center">
                <div className="max-w-xl mx-auto px-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                        {t('landing.finalCta.title')}
                    </h2>
                    <p className="text-gray-500 mb-8">
                        {t('landing.finalCta.desc')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            to="/register"
                            className="bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-900 transition text-center flex-1 sm:flex-none flex items-center justify-center"
                        >
                            {t('landing.finalCta.create')}
                        </Link>
                        <Link
                            to="/login"
                            className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-200 transition text-center flex-1 sm:flex-none flex items-center justify-center"
                        >
                            {t('landing.finalCta.login')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ──────────────────────────────────────────────── */}
            <footer className="bg-gray-800 text-gray-400 py-8">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 hover:text-white transition cursor-pointer text-left">
                            <span className="text-white font-bold text-lg">CeyLink</span>
                            <span>🇱🇰</span>
                            <span className="text-gray-400 text-sm ml-2">
                                {t('landing.footer.desc')}
                            </span>
                        </button>

                        <div className="flex items-center gap-6 text-sm">
                            <Link to="/login" className="hover:text-white transition">
                                {t('landing.footer.login')}
                            </Link>
                            <Link to="/register" className="hover:text-white transition">
                                {t('landing.footer.register')}
                            </Link>
                            <Link to="/admin/login" className="hover:text-white transition opacity-60">
                                Admin
                            </Link>
                            {/* Language switcher in footer */}
                            <div className="flex gap-1">
                                {languages.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => i18n.changeLanguage(lang.code)}
                                        className={`text-xs px-2 py-1 rounded transition ${i18n.language === lang.code
                                            ? 'bg-primary text-white'
                                            : 'hover:text-white'
                                            }`}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-6 pt-6 text-center text-xs text-gray-500">
                        {t('landing.footer.copyright')}
                    </div>
                </div>
            </footer>

        </div>
    )
}