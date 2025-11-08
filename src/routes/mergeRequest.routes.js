const express = require('express');
const router = express.Router();
const mergeRequestController = require('../controllers/mergeRequest.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/merge-requests/send
 * @desc    Send a merge request to a partner
 * @access  Private
 * @body    { partnerEmail: string, message?: string }
 */
router.post('/send', mergeRequestController.sendMergeRequest);

/**
 * @route   GET /api/merge-requests
 * @desc    Get all merge requests (sent and received)
 * @access  Private
 * @query   type: 'sent' | 'received' | undefined (both)
 * @query   status: 'pending' | 'approved' | 'rejected' | 'cancelled'
 */
router.get('/', mergeRequestController.getMergeRequests);

/**
 * @route   POST /api/merge-requests/:id/approve
 * @desc    Approve a merge request and merge families
 * @access  Private (recipient only)
 * @body    { responseMessage?: string }
 */
router.post('/:id/approve', mergeRequestController.approveMergeRequest);

/**
 * @route   POST /api/merge-requests/:id/reject
 * @desc    Reject a merge request
 * @access  Private (recipient only)
 * @body    { responseMessage?: string }
 */
router.post('/:id/reject', mergeRequestController.rejectMergeRequest);

/**
 * @route   POST /api/merge-requests/:id/cancel
 * @desc    Cancel a merge request (by requester)
 * @access  Private (requester only)
 */
router.post('/:id/cancel', mergeRequestController.cancelMergeRequest);

module.exports = router;
