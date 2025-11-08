const express = require('express');
const router = express.Router();
const {
  createPasswordEntry,
  getAllPasswordEntries,
  getFavoritePasswordEntries,
  getPasswordEntriesByCategory,
  getPasswordEntryById,
  updatePasswordEntry,
  toggleFavorite,
  deletePasswordEntry,
  getFamilyMembers
} = require('../controllers/passwordVault.controller');
const { protect } = require('../middleware/auth.middleware');

// Protect all routes
router.use(protect);

// Routes
router.route('/')
  .post(createPasswordEntry)       // POST /api/password-vault - Create new password entry
  .get(getAllPasswordEntries);     // GET /api/password-vault - Get all password entries for current user

router.route('/favorites')
  .get(getFavoritePasswordEntries); // GET /api/password-vault/favorites - Get favorite password entries

router.route('/category/:category')
  .get(getPasswordEntriesByCategory); // GET /api/password-vault/category/:category - Get entries by category

router.route('/family-members')
  .get(getFamilyMembers);  // GET /api/password-vault/family-members - Get family members for sharing

router.route('/:id/favorite')
  .patch(toggleFavorite);  // PATCH /api/password-vault/:id/favorite - Toggle favorite status

router.route('/:id')
  .get(getPasswordEntryById)    // GET /api/password-vault/:id - Get single password entry
  .put(updatePasswordEntry)     // PUT /api/password-vault/:id - Update password entry
  .delete(deletePasswordEntry); // DELETE /api/password-vault/:id - Delete password entry

module.exports = router;
