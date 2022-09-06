const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Post = require('../models/postModel');

// Registers a user
const registerUser = asyncHandler(async (req, res) => {
	const {username, email, password, confirmPassword} = req.body;
	// todo profilePic with multer

	// If existingUser is already a document in the users collection, log an error
	const existingUser = await User.findOne({email});
	if (existingUser) {
		res.status(409).json('User already exists');
		return;
	}

	// If username, email, password, and/or confirmPassword are undefined, log an error
	if (!username || !email || !password || !confirmPassword) {
		res.status(400).json('Username, email, password, and confirm password required');
		return;
	}

	// If password's length is not between 8 and 20 characters, log an error
	if (password.length < 8 || password.length > 20) {
		res.status(400).json('Password must be between 8 and 20 characters');
		return;
	}

	// If password and confirmPassword don't match, log an error
	if (password !== confirmPassword) {
		res.status(400).status('Password and confirm password must match');
		return;
	}

	// Hashes the password using a salt
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);

	// Creates a user document with the req.body information, but changes password and confirmPassword to be the hashed password
	const newUser = await User.create({
		username,
		email,
		password: hashedPassword,
		confirmPassword: hashedPassword
		// ! profilePic
	});

	// If creating the user document succeeds, send back its data as a JSON object
	if (newUser)
		res.status(201).json({
			id: newUser.id,
			username: newUser.username,
			email: newUser.email,
			profilePic: newUser.profilePic,
			// Creates a bearer token for the logged in user
			token: generateToken(newUser.id)
		});
	else res.status(400).json('Invalid user data');
});

// Logs in a user
const loginUser = asyncHandler(async (req, res) => {
	const {email, password} = req.body;

	// If existingUser is already a document in the users collection and the inputted password matches existingUser's unhashed password, send back its data as a JSON object
	const existingUser = await User.findOne({email});

	if (existingUser && (await bcrypt.compare(password, existingUser.password)))
		res.status(201).json({
			id: existingUser.id,
			username: existingUser.username,
			email: existingUser.email,
			profilePic: existingUser.profilePic,
			token: generateToken(existingUser.id)
		});
	else res.status(401).json('User not found, or invalid login');
});

// Gets the logged in user's information
const getUser = asyncHandler(async (req, res) => {
	// req.user is created in the protect function (check authMiddleware.js)
	// If a user is not logged in, log an error
	if (!req.user) {
		res.status(401).json('User not logged in');
		return;
	}

	// If existingUser is not a document in the users collection, log an error
	const existingUser = await User.findById(req.params.id);
	if (!existingUser) {
		res.status(404).json('User not found');
		return;
	}

	// If the logged in user's id matches the id in the route, send back its data as a JSON object
	if (req.user.id === req.params.id) res.status(200).json(req.user);
	else res.status(401).json('Logged in user can only get their own information');
});

// Updates the logged in user's information
const updateUser = asyncHandler(async (req, res) => {
	const {password, confirmPassword} = req.body;

	// If a user is not logged in, log an error
	if (!req.user) {
		res.status(401).json('User not logged in');
		return;
	}

	// If existingUser is not a document in the users collection, log an error
	const existingUser = await User.findById(req.params.id);
	if (!existingUser) {
		res.status(404).json('User not found');
		return;
	}

	// Checks if the logged in user's id matches the id in the route
	if (req.user.id === req.params.id) {
		// If the information to be updated includes the password, checks if password or confirmPassword are undefined, if password is between 8 and 20 characters, and if password and confirmPassword match
		if (
			password &&
			confirmPassword &&
			password.length > 7 &&
			password.length < 21 &&
			password === confirmPassword
		) {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			// Using password instead of req.body.password stores the password before it is hashed
			req.body.password = hashedPassword;
			req.body.confirmPassword = hashedPassword;
		} else if ((password && !confirmPassword) || (!password && confirmPassword)) {
			res.status(400).json('Updated password and confirm password required');
			return;
		} else if (password && (password.length < 8 || password.length > 20)) {
			res.status(400).json('Updated password must be between 8 and 20 characters');
			return;
		} else if (password !== confirmPassword) {
			res.status(400).json('Updated password and confirm password must match');
			return;
		}
	} else {
		res.status(401).json('Logged in user can only update themself');
		return;
	}

	// todo profilePic with multer

	// Finds a document using req.user.id, then updates it with the req.body information
	// {new: true} returns the document (i.e. updatedUser) after it is updated
	const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, {new: true});

	// If updating the user document succeeds, send back its data as a JSON object
	if (updatedUser)
		res.status(201).json({
			id: updatedUser.id,
			username: updatedUser.username,
			email: updatedUser.email,
			profilePic: updatedUser.profilePic,
			token: generateToken(existingUser.id)
		});
	else res.status(400).json('Invalid updated user data');
});

// Deletes the logged in user
const deleteUser = asyncHandler(async (req, res) => {
	// If a user is not logged in, log an error
	if (!req.user) {
		res.status(401).json('User not logged in');
		return;
	}

	// If existingUser is not a document in the users collection, log an error
	const existingUser = await User.findById(req.params.id);
	if (!existingUser) {
		res.status(404).json('User not found');
		return;
	}

	// If the logged in user's id matches the id in the route, delete all the Posts whose username key matches the logged in user's username, delete the logged in user, then send a message as a JSON object
	if (req.user.id === req.params.id) {
		await Post.deleteMany({username: req.user.username});
		await User.findByIdAndDelete(req.user.id);
		res.status(200).json('Deleted user and their posts');
	} else res.status(401).json('Logged in user can only delete themself');
});

// Creates a bearer token
const generateToken = userId => {
	// Signs the JSON web token with the user's id, takes the secret key, and states the bearer token expries in 30 days
	return jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: '30d'});
};

module.exports = {
	registerUser,
	loginUser,
	getUser,
	updateUser,
	deleteUser
};
