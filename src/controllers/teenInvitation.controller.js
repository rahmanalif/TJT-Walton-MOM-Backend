const TeenInvitation = require('../models/TeenInvitation.model');
const Parent = require('../models/Parent.model');
const Teen = require('../models/Teen.model');
const { sendEmail, sendSms } = require('../services/notification.service');

// @desc    Create and send teen invitation
// @route   POST /api/teen-invitations/send
// @access  Private (authenticated parent)
exports.sendTeenInvitation = async (req, res) => {
  try {
    const { teenName, accountRole, invitationMethod, email, phoneNumber } = req.body;
    const parentId = req.parent._id;

    // Validate required fields
    if (!teenName || !accountRole || !invitationMethod) {
      return res.status(400).json({
        success: false,
        message: 'Please provide teen name, account role, and invitation method'
      });
    }

    // Validate account role
    if (!['child', 'teen', 'young-adult'].includes(accountRole)) {
      return res.status(400).json({
        success: false,
        message: 'Account role must be one of: child, teen, young-adult'
      });
    }

    // Validate invitation method
    if (!['email', 'sms'].includes(invitationMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invitation method must be either email or sms'
      });
    }

    // Validate contact information based on method
    if (invitationMethod === 'email' && !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address for email invitation'
      });
    }

    if (invitationMethod === 'sms' && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a phone number for SMS invitation'
      });
    }

    // Get parent details
    const parent = await Parent.findById(parentId);
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    // Check if teen already exists with this email or phone
    if (email) {
      const existingTeen = await Teen.findOne({ email: email.toLowerCase() });
      if (existingTeen) {
        return res.status(400).json({
          success: false,
          message: 'A teen account with this email already exists'
        });
      }
    }

    if (phoneNumber) {
      const existingTeen = await Teen.findOne({ phoneNumber });
      if (existingTeen) {
        return res.status(400).json({
          success: false,
          message: 'A teen account with this phone number already exists'
        });
      }
    }

    // Check for existing pending invitation
    const query = {
      parent: parentId,
      status: 'pending'
    };
    if (email) query.email = email.toLowerCase();
    if (phoneNumber) query.phoneNumber = phoneNumber;

    const existingInvitation = await TeenInvitation.findOne(query);
    if (existingInvitation && !existingInvitation.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'An active invitation already exists for this contact. Please wait for it to expire or use the existing code.',
        data: {
          expiresAt: existingInvitation.expiresAt
        }
      });
    }

    // Create new invitation
    const invitation = await TeenInvitation.create({
      parent: parentId,
      teenName,
      accountRole,
      invitationMethod,
      email: email ? email.toLowerCase() : undefined,
      phoneNumber: phoneNumber || undefined,
      familyName: parent.familyname
    });

    // Send invitation based on method
    if (invitationMethod === 'email') {
      const emailSubject = `${parent.firstname} ${parent.lastname} invited you to join TJT Walton`;
      const emailText = `
Hello ${teenName}!

${parent.firstname} ${parent.lastname} has invited you to join their family (${parent.familyname}) on TJT Walton.

Your verification code is: ${invitation.verificationCode}

This code will expire in 30 minutes.

To complete your registration:
1. Go to ${process.env.FRONTEND_URL || 'http://localhost:3000'}/teen/register
2. Enter this verification code
3. Create your account

Welcome to the family!

Best regards,
TJT Walton Team
      `;

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
    .code { font-size: 32px; font-weight: bold; color: #3b82f6; text-align: center; padding: 20px; background: white; border-radius: 5px; margin: 20px 0; letter-spacing: 5px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to TJT Walton!</h1>
    </div>
    <div class="content">
      <h2>Hello ${teenName}!</h2>
      <p><strong>${parent.firstname} ${parent.lastname}</strong> has invited you to join their family <strong>${parent.familyname}</strong> on TJT Walton.</p>
      <p>Your verification code is:</p>
      <div class="code">${invitation.verificationCode}</div>
      <p><small>This code will expire in 30 minutes.</small></p>
      <p><strong>To complete your registration:</strong></p>
      <ol>
        <li>Go to the registration page</li>
        <li>Enter this verification code</li>
        <li>Create your account</li>
      </ol>
      <p>Welcome to the family!</p>
    </div>
    <div class="footer">
      <p>Best regards,<br>TJT Walton Team</p>
    </div>
  </div>
</body>
</html>
      `;

      try {
        await sendEmail({
          to: email,
          subject: emailSubject,
          text: emailText,
          html: emailHtml
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
      }
    } else if (invitationMethod === 'sms') {
      const smsBody = `${parent.firstname} ${parent.lastname} invited you to join ${parent.familyname} on TJT Walton. Your verification code is: ${invitation.verificationCode}. This code expires in 30 minutes. Register at ${process.env.FRONTEND_URL || 'http://localhost:3000'}/teen/register`;

      try {
        await sendSms({
          to: phoneNumber,
          body: smsBody
        });
      } catch (smsError) {
        console.error('Failed to send invitation SMS:', smsError);
      }
    }

    res.status(201).json({
      success: true,
      message: `Invitation sent successfully via ${invitationMethod}`,
      data: {
        invitation: {
          id: invitation._id,
          teenName: invitation.teenName,
          accountRole: invitation.accountRole,
          invitationMethod: invitation.invitationMethod,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          // Only include code in development
          ...(process.env.NODE_ENV === 'development' && { verificationCode: invitation.verificationCode })
        }
      }
    });
  } catch (error) {
    console.error('Error sending teen invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending invitation',
      error: error.message
    });
  }
};

// @desc    Verify invitation code
// @route   POST /api/teen-invitations/verify
// @access  Public
exports.verifyInvitationCode = async (req, res) => {
  try {
    const { code, email, phoneNumber } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a verification code'
      });
    }

    if (!email && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either email or phone number'
      });
    }

    // Find invitation by code and contact info
    const query = {
      verificationCode: code
    };
    if (email) query.email = email.toLowerCase();
    if (phoneNumber) query.phoneNumber = phoneNumber;

    const invitation = await TeenInvitation.findOne(query).populate('parent', 'firstname lastname familyname');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invalid verification code or contact information'
      });
    }

    try {
      // Verify the code (this also handles expiration and attempt limits)
      await invitation.verifyCode(code);

      res.status(200).json({
        success: true,
        message: 'Verification code is valid',
        data: {
          invitation: {
            id: invitation._id,
            teenName: invitation.teenName,
            accountRole: invitation.accountRole,
            familyName: invitation.familyName,
            parent: invitation.parent,
            email: invitation.email,
            phoneNumber: invitation.phoneNumber
          }
        }
      });
    } catch (verifyError) {
      return res.status(400).json({
        success: false,
        message: verifyError.message
      });
    }
  } catch (error) {
    console.error('Error verifying invitation code:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying code',
      error: error.message
    });
  }
};

// @desc    Get all invitations sent by parent
// @route   GET /api/teen-invitations/sent
// @access  Private (authenticated parent)
exports.getSentInvitations = async (req, res) => {
  try {
    const invitations = await TeenInvitation.find({ parent: req.parent._id })
      .populate('teenAccount', 'firstname lastname email phoneNumber')
      .sort('-createdAt')
      .select('-verificationCode'); // Don't expose codes

    res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sent invitations',
      error: error.message
    });
  }
};

// @desc    Resend invitation code
// @route   POST /api/teen-invitations/:id/resend
// @access  Private (authenticated parent)
exports.resendInvitation = async (req, res) => {
  try {
    const invitation = await TeenInvitation.findOne({
      _id: req.params.id,
      parent: req.parent._id
    }).populate('parent', 'firstname lastname familyname');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or you are not authorized'
      });
    }

    if (invitation.status === 'used') {
      return res.status(400).json({
        success: false,
        message: 'This invitation has already been used'
      });
    }

    // Generate new code and reset expiration
    invitation.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    invitation.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    invitation.status = 'pending';
    invitation.attemptCount = 0;
    await invitation.save();

    const parent = invitation.parent;

    // Resend based on method
    if (invitation.invitationMethod === 'email') {
      const emailSubject = `${parent.firstname} ${parent.lastname} invited you to join TJT Walton`;
      const emailText = `Hello ${invitation.teenName}!\n\nYour new verification code is: ${invitation.verificationCode}\n\nThis code will expire in 30 minutes.`;

      await sendEmail({
        to: invitation.email,
        subject: emailSubject,
        text: emailText
      });
    } else if (invitation.invitationMethod === 'sms') {
      const smsBody = `Your new TJT Walton verification code is: ${invitation.verificationCode}. This code expires in 30 minutes.`;
      await sendSms({
        to: invitation.phoneNumber,
        body: smsBody
      });
    }

    res.status(200).json({
      success: true,
      message: 'Invitation code resent successfully',
      data: {
        invitation: {
          id: invitation._id,
          expiresAt: invitation.expiresAt
        }
      }
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending invitation',
      error: error.message
    });
  }
};

// @desc    Cancel invitation
// @route   DELETE /api/teen-invitations/:id
// @access  Private (authenticated parent)
exports.cancelInvitation = async (req, res) => {
  try {
    const invitation = await TeenInvitation.findOne({
      _id: req.params.id,
      parent: req.parent._id
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or you are not authorized'
      });
    }

    if (invitation.status === 'used') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an invitation that has been used'
      });
    }

    await invitation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling invitation',
      error: error.message
    });
  }
};
