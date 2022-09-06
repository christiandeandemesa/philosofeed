const express = require('express');
const {
	registerUser,
	loginUser,
	getUser,
	updateUser,
	deleteUser
} = require('../controllers/userController');
const protect = require('../middleware/authMiddleware');

// todo multer

const router = express.Router();
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/:id', protect, getUser);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, deleteUser);

module.exports = router;
