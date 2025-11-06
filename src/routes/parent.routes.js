const express = require('express');
const router = express.Router();
const {
  getAllParents,
  getParentById,
  createParent,
  updateParent,
  deleteParent
} = require('../controllers/parent.controller');

router.route('/')
  .get(getAllParents)
  .post(createParent);

router.route('/:id')
  .get(getParentById)
  .put(updateParent)
  .delete(deleteParent);

module.exports = router;