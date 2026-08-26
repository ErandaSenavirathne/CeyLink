import React from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import SEO from '../components/SEO'
import { useAuth } from '../context/AuthContext'

export default function Guide() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Help & Guide | CeyLink"
        description="Learn how to use CeyLink as a customer or service provider."
      />
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">{t('guide.pageTitle', 'How to Use CeyLink')}</h1>

        <div className="space-y-12">
          {/* Customer Section */}
          {(!user || user.role === 'CUSTOMER' || user.role === 'ADMIN') && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
                <span className="text-3xl">👤</span> {t('guide.customerSection', 'For Customers')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center text-xl font-bold">1</div>
                  <h3 className="font-semibold text-gray-800">{t('guide.customer.slide2.title', 'Search & Filter')}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('guide.customer.slide2.content', 'Use the Browse page to find providers. You can filter by category or use the new "📍 Nearest to me" toggle to instantly prioritize professionals in your exact city!')}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center text-xl font-bold">2</div>
                  <h3 className="font-semibold text-gray-800">{t('guide.customer.slide3.title', 'Book Appointments')}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('guide.customer.slide3.content', 'Once you find a provider, click View Profile to read real reviews and book an appointment directly. Track all your upcoming jobs in your Dashboard!')}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center text-xl font-bold">3</div>
                  <h3 className="font-semibold text-gray-800">{t('guide.customer.review.title', 'Leave a Review')}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('guide.customer.review.content', 'After the job is completed, you can leave a star rating and a review from your Dashboard to help other customers find great providers.')}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Provider Section */}
          {(!user || user.role === 'PROVIDER' || user.role === 'ADMIN') && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-accent mb-6 flex items-center gap-2">
                <span className="text-3xl">💼</span> {t('guide.providerSection', 'For Service Providers')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-orange-50 text-accent rounded-xl flex items-center justify-center text-xl font-bold">1</div>
                  <h3 className="font-semibold text-gray-800">{t('guide.provider.slide2.title', 'Complete Your Profile')}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('guide.provider.slide2.content', 'Make sure to add a bio, hourly rate, and upload your NIC for verification. Verified providers get a green checkmark and rank higher in search results!')}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="w-12 h-12 bg-orange-50 text-accent rounded-xl flex items-center justify-center text-xl font-bold">2</div>
                  <h3 className="font-semibold text-gray-800">{t('guide.provider.slide3.title', 'Add Your Services')}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('guide.provider.slide3.content', 'Go to your Profile and add the specific services you offer (e.g., "Pipe Repair" under Plumbing). Customers search for these services!')}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="w-12 h-12 bg-orange-50 text-accent rounded-xl flex items-center justify-center text-xl font-bold">3</div>
                  <h3 className="font-semibold text-gray-800">{t('guide.provider.slide4.title', 'Manage Bookings')}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('guide.provider.slide4.content', 'Customers will send you booking requests. Check your Dashboard to Accept or Reject them. Complete jobs successfully to earn 5-star reviews!')}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-orange-50 text-accent rounded-xl flex items-center justify-center text-xl font-bold">4</div>
                  <h3 className="font-semibold text-gray-800">{t('guide.provider.availability.title', 'Set Availability')}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('guide.provider.availability.content', 'If you are currently busy and cannot accept new bookings, toggle your "Available / Busy" switch in your Dashboard so customers know your status.')}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
