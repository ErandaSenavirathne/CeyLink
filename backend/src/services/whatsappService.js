const twilio = require('twilio')

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

/**
 * Sends a WhatsApp message. Fails silently (logs error) instead of crashing
 * the booking flow if WhatsApp delivery fails — notifications should never
 * block the core feature.
 */
async function sendWhatsAppMessage(to, body) {
  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: to, // must be in format 'whatsapp:+94771234567'
      body
    })
    console.log(`✅ WhatsApp sent: ${message.sid}`)
    return { success: true, sid: message.sid }
  } catch (error) {
    console.error('⚠️ WhatsApp send failed:', error.message)
    return { success: false, error: error.message }
  }
}

// Notify provider when a new booking comes in
async function notifyNewBooking(providerPhone, customerName, serviceTitle, date, timeSlot) {
  const body = `🔔 *New Booking Request - CeyLink*\n\nCustomer: ${customerName}\nService: ${serviceTitle}\nDate: ${date}\nTime: ${timeSlot}\n\nOpen the app to accept or decline this booking.`
  return sendWhatsAppMessage(`whatsapp:${providerPhone}`, body)
}

// Notify customer when their booking is confirmed
async function notifyBookingConfirmed(customerPhone, providerName, serviceTitle, date, timeSlot) {
  const body = `✅ *Booking Confirmed - CeyLink*\n\n${providerName} has confirmed your booking for ${serviceTitle}.\nDate: ${date}\nTime: ${timeSlot}\n\nThank you for using CeyLink! 🇱🇰`
  return sendWhatsAppMessage(`whatsapp:${customerPhone}`, body)
}

// Notify customer when booking is cancelled/rejected
async function notifyBookingCancelled(customerPhone, serviceTitle) {
  const body = `❌ *Booking Update - CeyLink*\n\nYour booking for ${serviceTitle} has been cancelled. Please browse other available providers on CeyLink.`
  return sendWhatsAppMessage(`whatsapp:${customerPhone}`, body)
}

// Notify provider when the customer cancels a booking
async function notifyProviderCancelled(providerPhone, customerName, serviceTitle) {
  const body = `❌ *Booking Cancelled - CeyLink*\n\n${customerName} has cancelled their booking for ${serviceTitle}.\n\nThis time slot is now available again.`
  return sendWhatsAppMessage(`whatsapp:${providerPhone}`, body)
}

module.exports = {
  sendWhatsAppMessage,
  notifyNewBooking,
  notifyBookingConfirmed,
  notifyBookingCancelled,
  notifyProviderCancelled
}