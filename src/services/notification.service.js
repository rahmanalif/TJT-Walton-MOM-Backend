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

/**
 * Send an SMS message
 * @param {string} to - Recipient's phone number (in E.164 format)
 * @param {string} body - SMS message body
 */
const sendSms = async ({ to, body }) => {
  console.log('--- SMS Notification ---');
  console.log(`To: ${to}`);
  console.log(`Body: ${body}`);
  console.log('------------------------');
  return Promise.resolve();
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
