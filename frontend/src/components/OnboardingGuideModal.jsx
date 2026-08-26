import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'

export default function OnboardingGuideModal() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  
  const [isOpen, setIsOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    // Only show to logged in users on the main routes (not admin panel or standalone guide)
    if (!user || user.role === 'ADMIN' || location.pathname.startsWith('/admin') || location.pathname === '/guide') {
      return
    }

    const viewKey = `guideViews_${user.id}`
    const views = parseInt(localStorage.getItem(viewKey) || '0', 10)

    if (views < 3) {
      // Delay slightly so it doesn't jarringly pop up before page renders
      const timer = setTimeout(() => setIsOpen(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [user, location.pathname])

  if (!isOpen || !user) return null

  const handleClose = () => {
    const viewKey = `guideViews_${user.id}`
    const views = parseInt(localStorage.getItem(viewKey) || '0', 10)
    localStorage.setItem(viewKey, (views + 1).toString())
    setIsOpen(false)
    setCurrentSlide(0)
  }

  const customerSlides = [
    {
      title: t('guide.customer.slide1.title', 'Welcome to CeyLink! 👋'),
      content: t('guide.customer.slide1.content', 'The easiest way to find trusted, verified service professionals in Sri Lanka. Let\'s take a quick tour!'),
      icon: '🎉'
    },
    {
      title: t('guide.customer.slide2.title', 'Search & Filter'),
      content: t('guide.customer.slide2.content', 'Use the Browse page to find providers. You can filter by category or use the new "📍 Nearest to me" toggle to instantly prioritize professionals in your exact city!'),
      icon: '🔍'
    },
    {
      title: t('guide.customer.slide3.title', 'Book Appointments'),
      content: t('guide.customer.slide3.content', 'Once you find a provider, click View Profile to read real reviews and book an appointment directly. Track all your upcoming jobs in your Dashboard!'),
      icon: '📅'
    }
  ]

  const providerSlides = [
    {
      title: t('guide.provider.slide1.title', 'Welcome to CeyLink Provider! 🚀'),
      content: t('guide.provider.slide1.content', 'Let\'s get your business online and start reaching more local customers.'),
      icon: '💼'
    },
    {
      title: t('guide.provider.slide2.title', 'Complete Your Profile'),
      content: t('guide.provider.slide2.content', 'Make sure to add a bio, hourly rate, and upload your NIC for verification. Verified providers get a green checkmark and rank higher in search results!'),
      icon: '✅'
    },
    {
      title: t('guide.provider.slide3.title', 'Add Your Services'),
      content: t('guide.provider.slide3.content', 'Go to your Profile and add the specific services you offer (e.g., "Pipe Repair" under Plumbing). Customers search for these services!'),
      icon: '🛠️'
    },
    {
      title: t('guide.provider.slide4.title', 'Manage Bookings'),
      content: t('guide.provider.slide4.content', 'Customers will send you booking requests. Check your Dashboard to Accept or Reject them. Complete jobs successfully to earn 5-star reviews!'),
      icon: '📱'
    }
  ]

  const slides = user.role === 'PROVIDER' ? providerSlides : customerSlides

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-slide-up">
        
        {/* Progress Bar */}
        <div className="flex h-1 bg-gray-100">
          {slides.map((_, idx) => (
            <div 
              key={idx} 
              className={`flex-1 transition-colors duration-300 ${idx <= currentSlide ? 'bg-primary' : ''}`}
            />
          ))}
        </div>

        <div className="p-8 text-center">
          <div className="text-6xl mb-6">{slides[currentSlide].icon}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">{slides[currentSlide].title}</h2>
          <p className="text-gray-600 leading-relaxed min-h-[80px]">
            {slides[currentSlide].content}
          </p>

          <div className="flex justify-between items-center mt-10">
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-sm font-medium transition"
            >
              {t('guide.skip', 'Skip Tour')}
            </button>

            <div className="flex gap-3">
              {currentSlide > 0 && (
                <button 
                  onClick={() => setCurrentSlide(s => s - 1)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition"
                >
                  {t('guide.back', 'Back')}
                </button>
              )}
              
              {currentSlide < slides.length - 1 ? (
                <button 
                  onClick={() => setCurrentSlide(s => s + 1)}
                  className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-900 transition shadow-sm"
                >
                  {t('guide.next', 'Next')}
                </button>
              ) : (
                <button 
                  onClick={handleClose}
                  className="px-6 py-2 bg-accent text-white rounded-lg font-medium hover:bg-orange-600 transition shadow-sm"
                >
                  {t('guide.finish', 'Get Started')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Read later hint */}
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {t('guide.readLater', 'You can always read this later in the')} <Link to="/guide" onClick={handleClose} className="text-primary hover:underline font-medium">{t('guide.dedicatedSection', 'Help & Guide section')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
