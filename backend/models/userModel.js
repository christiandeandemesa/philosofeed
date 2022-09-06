const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			// Every user document must have a unique username
			unique: true
		},
		email: {
			type: String,
			required: true,
			unique: true
		},
		password: {
			type: String,
			required: true
		},
		confirmPassword: {
			type: String,
			required: true
		},
		profilePic: {
			type: String,
			// A default profile picture is given if not included when registering a user
			default: 'default-profile.jpg'
		}
	},
	// Automatically includes createdAt and updatedAt time stamps
	{timestamps: true}
);

module.exports = mongoose.model('User', userSchema);
