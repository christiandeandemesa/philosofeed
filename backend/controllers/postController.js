const asyncHandler = require('express-async-handler');
const Post = require('../models/postModel');

// Creates a post
const createPost = asyncHandler(async (req, res) => {
	const {title, description, categories} = req.body;

	// If a user is not logged in, log an error
	if (!req.user) {
		res.status(401).json('User not logged in');
		return;
	}

	// If title and/or description are undefined, log an error
	if (!title || !description) {
		res.status(400).json('Title and description required');
		return;
	}

	// todo photo with multer

	// If categories is not undefined, convert it into an array
	let categoriesArr;
	if (categories !== undefined)
		categoriesArr = categories.split(',').map(category => category.trim());

	// Creates a post document with the req.body information, but adds the username key with a value of the logged in user's username
	const newPost = await Post.create({
		title,
		description,
		username: req.user.username,
		// ! photo
		categories: categoriesArr
	});

	// If creating the post document succeeds, send back its data as a JSON object
	if (newPost) res.status(201).json(newPost);
	else res.status(400).json('Invalid post data');
});

// Gets one post
const getOnePost = asyncHandler(async (req, res) => {
	// If existingPost is already a document in the posts collection, send back its data as a JSON object
	const existingPost = await Post.findById(req.params.id);
	if (existingPost) res.status(200).json(existingPost);
	else res.status(404).json('Post not found');
});

// Gets all the posts
const getAllPosts = asyncHandler(async (req, res) => {
	// If the url is http://localhost:5000/posts?user=Dyslecix96, then username would be Dyslecix96
	const username = req.query.user;
	// If the url is http://localhost:5000/posts?category=metaphysics, then catName would be metaphysics
	const catName = req.query.category;

	let posts;
	// If username is not undefined, get all the post documents with username: username
	if (username) posts = await Post.find({username});
	// If catName is not undefined, get all the post documents with the catName as an element in the categories array
	else if (catName) posts = await Post.find({categories: catName});
	// If username and catName are undefined, get all the post documents
	else posts = await Post.find();

	// If you get at least one post document, send back all their data as JSON object(s)
	if (posts.length > 0) res.status(200).json(posts);
	else res.status(404).json('Posts not found');
});

// Updates a post's information
const updatePost = asyncHandler(async (req, res) => {
	const {categories} = req.body;

	console.log(req.user);

	// If a user is not logged in, throw an error
	if (!req.user) {
		res.status(401).json('User not logged in');
		return;
	}

	// If existingPost is not a document in the posts collection, throw an error
	const existingPost = await Post.findById(req.params.id);
	if (!existingPost) {
		res.status(404).json('Post not found');
		return;
	}

	// Checks if the user who created the existingPost matches the logged in user
	if (existingPost.username === req.user.username) {
		// If the information to be updated includes categories, convert it into an array
		if (categories)
			req.body.categories = categories.split(',').map(category => category.trim());
	} else {
		res.status(401).json('Only the user that created this post can update it');
		return;
	}

	// todo photo with multer

	// If updating the post document succeeds, send back its data as a JSON object
	const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, {new: true});
	if (updatedPost) res.status(201).json(updatedPost);
	else res.status(400).json('Invalid updated post data');
});

// Deletes a post
const deletePost = asyncHandler(async (req, res) => {
	// If a user is not logged in, throw an error
	if (!req.user) {
		res.status(401).json('User not logged in');
		return;
	}

	// If existingPost is not a document in the posts collection, throw an error
	const existingPost = await Post.findById(req.params.id);
	if (!existingPost) {
		res.status(404).json('Post not found');
		return;
	}

	// If the user who created the existingPost matches the logged in user, delete the post, then send a message as a JSON object
	if (existingPost.username === req.user.username) {
		await Post.findByIdAndDelete(req.params.id);
		res.status(200).json('Deleted post');
	} else res.status(401).json('Only the user that created this post can delete it');
});

module.exports = {
	createPost,
	getOnePost,
	getAllPosts,
	updatePost,
	deletePost
};
