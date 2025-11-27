/**
 * OTP Service for Admin Dashboard Authentication
 * Sends OTP via EmailJS to authorized email
 */

import emailjs from '@emailjs/browser';

// EmailJS Configuration
// Get your keys from: https://www.emailjs.com/
const EMAILJS_SERVICE_ID = 'service_2n09tlh'; // Replace with your service ID
const EMAILJS_TEMPLATE_ID = 'template_qqj7276'; // Replace with your template ID
const EMAILJS_PUBLIC_KEY = 'EhyhDIZQ3Hvf6I71CY'; // Replace with your public key

// Authorized admin email
const ADMIN_EMAIL = 'amantalwar04@gmail.com';

// OTP storage (in-memory, expires after 5 minutes)
let currentOTP = null;
let otpExpiry = null;

/**
 * Generate a 6-digit OTP
 * @returns {string} - 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP to admin email via EmailJS
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendOTPToAdmin = async () => {
  try {
    // Generate new OTP
    currentOTP = generateOTP();
    otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes from now
    
    console.log('🔐 Generated OTP:', currentOTP); // For development - remove in production
    console.log('📧 Sending OTP to:', ADMIN_EMAIL);
    

    // Send email via EmailJS
    const templateParams = {
      to_email: ADMIN_EMAIL,
      otp_code: currentOTP,
      expiry_minutes: 5,
      timestamp: new Date().toLocaleString()
    };
    
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
    
    console.log('✅ OTP sent successfully to', ADMIN_EMAIL);
    return { success: true, message: 'OTP sent to your email' };
    
  } catch (error) {
    console.error('❌ Failed to send OTP:', error);
    return { success: false, message: 'Failed to send OTP. Please try again.' };
  }
};

/**
 * Verify OTP entered by user
 * @param {string} enteredOTP - OTP entered by user
 * @returns {boolean} - true if OTP is valid and not expired
 */
export const verifyOTP = (enteredOTP) => {
  // Check if OTP exists
  if (!currentOTP) {
    console.log('❌ No OTP has been generated');
    return false;
  }
  
  // Check if OTP has expired
  if (Date.now() > otpExpiry) {
    console.log('❌ OTP has expired');
    currentOTP = null;
    otpExpiry = null;
    return false;
  }
  
  // Verify OTP
  const isValid = enteredOTP.trim() === currentOTP;
  
  if (isValid) {
    console.log('✅ OTP verified successfully');
    // Clear OTP after successful verification
    currentOTP = null;
    otpExpiry = null;
  } else {
    console.log('❌ Invalid OTP');
  }
  
  return isValid;
};

/**
 * Check if user is authorized admin
 * @returns {boolean}
 */
export const isAuthorizedAdmin = () => {
  // For development, you can temporarily bypass OTP
  // return true; // Remove this in production
  
  // In production, check if OTP session is valid
  const otpSession = localStorage.getItem('ekamanam_admin_session');
  if (otpSession) {
    const sessionData = JSON.parse(otpSession);
    // Session valid for 1 hour
    if (Date.now() < sessionData.expiry) {
      return true;
    } else {
      localStorage.removeItem('ekamanam_admin_session');
    }
  }
  return false;
};

/**
 * Create admin session after successful OTP verification
 */
export const createAdminSession = () => {
  const sessionData = {
    authorized: true,
    expiry: Date.now() + 60 * 60 * 1000, // 1 hour
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('ekamanam_admin_session', JSON.stringify(sessionData));
  console.log('✅ Admin session created');
};

/**
 * Clear admin session
 */
export const clearAdminSession = () => {
  localStorage.removeItem('ekamanam_admin_session');
  console.log('🚪 Admin session cleared');
};

export default {
  sendOTPToAdmin,
  verifyOTP,
  isAuthorizedAdmin,
  createAdminSession,
  clearAdminSession
};

