const Parent = require('../models/Parent.model');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private (requires authentication)
exports.getSettings = async (req, res) => {
  try {
    // req.parent is set by auth middleware
    const parent = await Parent.findById(req.parent._id).select('settings notificationPreference displayName firstname lastname');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        settings: parent.settings || {},
        notificationPreference: parent.notificationPreference,
        displayName: parent.displayName || parent.firstname || 'User',
        firstname: parent.firstname,
        lastname: parent.lastname
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message
    });
  }
};

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private (requires authentication)
exports.updateSettings = async (req, res) => {
  try {
    const { settings, notificationPreference } = req.body;

    const updateData = {};

    if (settings) {
      updateData.settings = settings;
    }

    if (notificationPreference) {
      updateData.notificationPreference = notificationPreference;
    }

    const parent = await Parent.findByIdAndUpdate(
      req.parent._id,
      { $set: updateData },
      {
        new: true,
        runValidators: true
      }
    ).select('settings notificationPreference');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        settings: parent.settings,
        notificationPreference: parent.notificationPreference
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating settings',
      error: error.message
    });
  }
};

// @desc    Update specific setting category
// @route   PATCH /api/settings/:category
// @access  Private (requires authentication)
exports.updateSettingCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = ['mindfulUsage', 'notifications', 'appearance'];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    const updateData = {};
    updateData[`settings.${category}`] = req.body;

    const parent = await Parent.findByIdAndUpdate(
      req.parent._id,
      { $set: updateData },
      {
        new: true,
        runValidators: true
      }
    ).select('settings');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `${category} settings updated successfully`,
      data: parent.settings
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating settings category',
      error: error.message
    });
  }
};

// @desc    Reset settings to defaults
// @route   POST /api/settings/reset
// @access  Private (requires authentication)
exports.resetSettings = async (req, res) => {
  try {
    const defaultSettings = {
      mindfulUsage: {
        enabled: false,
        reminderInterval: 20, // Valid options: 10, 15, 20, 30, 40, 45
        breakDuration: 5, // Range: 2-15 minutes
        dailyUsageGoal: 120 // Range: 30-300 minutes (increment by 15)
      },
      notifications: {
        pushEnabled: true
      },
      appearance: {
        theme: 'light'
      }
    };

    const parent = await Parent.findByIdAndUpdate(
      req.parent._id,
      { $set: { settings: defaultSettings } },
      {
        new: true,
        runValidators: true
      }
    ).select('settings');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Settings reset to defaults',
      data: parent.settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resetting settings',
      error: error.message
    });
  }
};

// @desc    Get profile settings
// @route   GET /api/settings/profile
// @access  Private (requires authentication)
exports.getProfileSettings = async (req, res) => {
  try {
    const parent = await Parent.findById(req.parent._id).select('firstname lastname displayName email phoneNumber settings.profile settings.appearance');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        displayName: parent.displayName || parent.firstname || 'User',
        firstname: parent.firstname,
        lastname: parent.lastname,
        email: parent.email,
        phoneNumber: parent.phoneNumber,
        appTheme: parent.settings?.appearance?.theme || 'light',
        timeFormat: parent.settings?.profile?.timeFormat || '12-hour'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile settings',
      error: error.message
    });
  }
};

// @desc    Update profile settings
// @route   PUT /api/settings/profile
// @access  Private (requires authentication)
exports.updateProfileSettings = async (req, res) => {
  try {
    const { displayName, appTheme, timeFormat } = req.body;

    const updateData = {};

    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }

    if (appTheme) {
      updateData['settings.appearance.theme'] = appTheme;
    }

    if (timeFormat) {
      updateData['settings.profile.timeFormat'] = timeFormat;
    }

    const parent = await Parent.findByIdAndUpdate(
      req.parent._id,
      { $set: updateData },
      {
        new: true,
        runValidators: true
      }
    ).select('firstname lastname displayName email phoneNumber settings.profile settings.appearance');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile settings updated successfully',
      data: {
        displayName: parent.displayName || parent.firstname || 'User',
        firstname: parent.firstname,
        lastname: parent.lastname,
        email: parent.email,
        phoneNumber: parent.phoneNumber,
        appTheme: parent.settings?.appearance?.theme || 'light',
        timeFormat: parent.settings?.profile?.timeFormat || '12-hour'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating profile settings',
      error: error.message
    });
  }
};

// @desc    Get privacy settings
// @route   GET /api/settings/privacy
// @access  Private (requires authentication)
exports.getPrivacySettings = async (req, res) => {
  try {
    const parent = await Parent.findById(req.parent._id).select('settings.privacy');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return privacy settings with defaults if not set
    const privacySettings = parent.settings?.privacy || {
      shareActivityStatus: true,
      locationSharing: false,
      usageAnalytics: true,
      marketingCommunications: false,
      dataBackupToCloud: true
    };

    res.status(200).json({
      success: true,
      data: privacySettings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching privacy settings',
      error: error.message
    });
  }
};

// @desc    Update privacy settings
// @route   PUT /api/settings/privacy
// @access  Private (requires authentication)
exports.updatePrivacySettings = async (req, res) => {
  try {
    const {
      shareActivityStatus,
      locationSharing,
      usageAnalytics,
      marketingCommunications,
      dataBackupToCloud
    } = req.body;

    const updateData = {};

    if (shareActivityStatus !== undefined) {
      updateData['settings.privacy.shareActivityStatus'] = shareActivityStatus;
    }

    if (locationSharing !== undefined) {
      updateData['settings.privacy.locationSharing'] = locationSharing;
    }

    if (usageAnalytics !== undefined) {
      updateData['settings.privacy.usageAnalytics'] = usageAnalytics;
    }

    if (marketingCommunications !== undefined) {
      updateData['settings.privacy.marketingCommunications'] = marketingCommunications;
    }

    if (dataBackupToCloud !== undefined) {
      updateData['settings.privacy.dataBackupToCloud'] = dataBackupToCloud;
    }

    const parent = await Parent.findByIdAndUpdate(
      req.parent._id,
      { $set: updateData },
      {
        new: true,
        runValidators: true
      }
    ).select('settings.privacy');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: parent.settings.privacy
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating privacy settings',
      error: error.message
    });
  }
};

// @desc    Get security settings
// @route   GET /api/settings/security
// @access  Private (requires authentication)
exports.getSecuritySettings = async (req, res) => {
  try {
    const parent = await Parent.findById(req.parent._id).select('settings.security activeSessions');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return security settings with defaults if not set
    const securitySettings = parent.settings?.security || {
      twoFactorEnabled: false,
      loginNotifications: true,
      autoLockApp: false,
      autoLockTimeout: 15
    };

    // Format active sessions
    const sessions = parent.activeSessions || [];
    const formattedSessions = sessions.map(session => ({
      id: session._id,
      deviceName: session.deviceName,
      deviceType: session.deviceType,
      lastActive: session.lastActive,
      isCurrentDevice: session.isCurrentDevice
    }));

    res.status(200).json({
      success: true,
      data: {
        ...securitySettings,
        activeSessions: formattedSessions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching security settings',
      error: error.message
    });
  }
};

// @desc    Update security settings
// @route   PUT /api/settings/security
// @access  Private (requires authentication)
exports.updateSecuritySettings = async (req, res) => {
  try {
    const {
      twoFactorEnabled,
      loginNotifications,
      autoLockApp,
      autoLockTimeout
    } = req.body;

    const updateData = {};

    if (twoFactorEnabled !== undefined) {
      updateData['settings.security.twoFactorEnabled'] = twoFactorEnabled;
    }

    if (loginNotifications !== undefined) {
      updateData['settings.security.loginNotifications'] = loginNotifications;
    }

    if (autoLockApp !== undefined) {
      updateData['settings.security.autoLockApp'] = autoLockApp;
    }

    if (autoLockTimeout !== undefined) {
      updateData['settings.security.autoLockTimeout'] = autoLockTimeout;
    }

    const parent = await Parent.findByIdAndUpdate(
      req.parent._id,
      { $set: updateData },
      {
        new: true,
        runValidators: true
      }
    ).select('settings.security');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Security settings updated successfully',
      data: parent.settings.security
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating security settings',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   POST /api/settings/security/change-password
// @access  Private (requires authentication)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password, new password, and confirmation'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get parent with password
    const parent = await Parent.findById(req.parent._id).select('+password');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if current password is correct
    const isMatch = await parent.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by pre-save middleware)
    parent.password = newPassword;
    await parent.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

// @desc    Get active sessions
// @route   GET /api/settings/security/sessions
// @access  Private (requires authentication)
exports.getActiveSessions = async (req, res) => {
  try {
    const parent = await Parent.findById(req.parent._id).select('activeSessions');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const sessions = parent.activeSessions || [];
    const formattedSessions = sessions.map(session => ({
      id: session._id,
      deviceName: session.deviceName,
      deviceType: session.deviceType,
      lastActive: session.lastActive,
      ipAddress: session.ipAddress,
      isCurrentDevice: session.isCurrentDevice
    }));

    res.status(200).json({
      success: true,
      data: formattedSessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active sessions',
      error: error.message
    });
  }
};

// @desc    Revoke a session
// @route   DELETE /api/settings/security/sessions/:sessionId
// @access  Private (requires authentication)
exports.revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const parent = await Parent.findByIdAndUpdate(
      req.parent._id,
      {
        $pull: {
          activeSessions: { _id: sessionId }
        }
      },
      { new: true }
    ).select('activeSessions');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session revoked successfully',
      data: parent.activeSessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error revoking session',
      error: error.message
    });
  }
};
