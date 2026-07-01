// Jest automatically uses this fake version instead of the real one during tests
module.exports = {
  sendWhatsAppMessage: jest.fn().mockResolvedValue({ success: true, sid: 'TEST_SID' }),
  notifyNewBooking: jest.fn().mockResolvedValue({ success: true }),
  notifyBookingConfirmed: jest.fn().mockResolvedValue({ success: true }),
  notifyBookingCancelled: jest.fn().mockResolvedValue({ success: true }),
  notifyProviderCancelled: jest.fn().mockResolvedValue({ success: true })
}