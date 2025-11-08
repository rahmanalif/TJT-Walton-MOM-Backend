const nodemailer = require('nodemailer');
const twilio = require('twilio');

//------------------ Email ------------------//

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send an email
 * @param {string} to - Recipient's email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.log('--- Email Notification (SMTP not configured) ---');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text}`);
      console.log('--------------------------');
      return Promise.resolve();
    }

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'TJT Walton'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('--- Email Sent Successfully ---');
    console.log(`Message ID: ${info.messageId}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('--------------------------------');
    return info;
  } catch (error) {
    console.error('--- Email Sending Failed ---');
    console.error(`Error: ${error.message}`);
    console.error('----------------------------');
    throw error;
  }
};

//------------------ SMS ------------------//

// Initialize Twilio client if credentials are available
let twilioClient = null;
if (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_ACCOUNT_SID.startsWith('AC') && // Valid Twilio Account SID format
  process.env.TWILIO_ACCOUNT_SID !== 'your-twilio-account-sid' // Not placeholder
) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (error) {
    console.warn('Failed to initialize Twilio client:', error.message);
  }
}

/**
 * Send an SMS message
 * @param {string} to - Recipient's phone number (in E.164 format, e.g., +1234567890)
 * @param {string} body - SMS message body
 */
const sendSms = async ({ to, body }) => {
  try {
    // Check if Twilio is configured
    if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
      console.log('--- SMS Notification (Twilio not configured) ---');
      console.log(`To: ${to}`);
      console.log(`Body: ${body}`);
      console.log('------------------------------------------------');
      console.log('SETUP INSTRUCTIONS:');
      console.log('1. Sign up for Twilio: https://www.twilio.com/try-twilio');
      console.log('2. Get your Account SID, Auth Token, and Phone Number');
      console.log('3. Add them to your .env file');
      console.log('------------------------------------------------');
      return Promise.resolve();
    }

    // Format phone number to E.164 if not already
    let formattedNumber = to;
    if (!to.startsWith('+')) {
      // If US number without country code, add +1
      if (to.length === 10) {
        formattedNumber = `+1${to}`;
      } else if (to.length === 11 && to.startsWith('1')) {
        formattedNumber = `+${to}`;
      }
    }

    const message = await twilioClient.messages.create({
      body: body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber
    });

    console.log('--- SMS Sent Successfully ---');
    console.log(`Message SID: ${message.sid}`);
    console.log(`To: ${formattedNumber}`);
    console.log(`Status: ${message.status}`);
    console.log(`Body: ${body}`);
    console.log('-----------------------------');
    return message;
  } catch (error) {
    console.error('--- SMS Sending Failed ---');
    console.error(`Error: ${error.message}`);
    console.error(`To: ${to}`);
    console.error('---------------------------');

    // Don't throw error in development, just log it
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    return Promise.resolve();
  }
};

//------------------ Notification Service ------------------//

/**
 * Send notification based on user preference
 * @param {object} user - User object with notification preferences
 * @param {string} subject - Email subject
 * @param {string} text - Plain text for email/SMS
 * @param {string} html - HTML body for email
 */
const sendNotification = async ({ user, subject, text, html }) => {
  const { notificationPreference, email, phoneNumber } = user;

  switch (notificationPreference) {
    case 'email':
      if (email) {
        await sendEmail({ to: email, subject, text, html });
      }
      break;
    case 'sms':
      if (phoneNumber) {
        await sendSms({ to: phoneNumber, body: text });
      }
      break;
    case 'both':
      if (email) {
        await sendEmail({ to: email, subject, text, html });
      }
      if (phoneNumber) {
        await sendSms({ to: phoneNumber, body: text });
      }
      break;
    case 'none':
    default:
      // Do nothing
      break;
  }
};

module.exports = {
  sendEmail,
  sendSms,
  sendNotification
};
