const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  updateSettingCategory,
  resetSettings,
  getProfileSettings,
  updateProfileSettings,
  getPrivacySettings,
  updatePrivacySettings,
  getSecuritySettings,
  updateSecuritySettings,
  changePassword,
  getActiveSessions,
  revokeSession
} = require('../controllers/settings.controller');

// Protect routes with auth middleware
const { protect } = require('../middleware/auth.middleware');
router.use(protect);

// Get and update all settings
router.route('/')
  .get(getSettings)
  .put(updateSettings);

// Profile settings
router.route('/profile')
  .get(getProfileSettings)
  .put(updateProfileSettings);

// Privacy settings
router.route('/privacy')
  .get(getPrivacySettings)
  .put(updatePrivacySettings);

// Security settings
router.route('/security')
  .get(getSecuritySettings)
  .put(updateSecuritySettings);

// Change password
router.post('/security/change-password', changePassword);

// Active sessions
router.route('/security/sessions')
  .get(getActiveSessions);

router.delete('/security/sessions/:sessionId', revokeSession);

// Reset settings to defaults
router.post('/reset', resetSettings);

// Update specific setting category
router.patch('/:category', updateSettingCategory);

module.exports = router;
