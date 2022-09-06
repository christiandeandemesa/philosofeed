const express = require('express');
const {
	createPost,
	getOnePost,
	getAllPosts,
	updatePost,
	deletePost
} = require('../controllers/postController');
const protect = require('../middleware/authMiddleware');

// todo multer

const router = express.Router();
router.post('/', protect, createPost);
router.get('/:id', getOnePost);
router.get('/', getAllPosts);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);

module.exports = router;
