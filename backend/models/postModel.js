const mongoose = require('mongoose');

const postSchema = mongoose.Schema(
	{
		title: {
			type: String,
			required: true
		},
		description: {
			type: String,
			required: true
		},
		username: {
			type: String,
			required: true
		},
		photo: {
			type: String,
			// A default photo is given if not included when creating a post
			default: 'default-photo.jpg'
		},
		categories: {
			type: Array
		}
	},
	{timestamps: true}
);

module.exports = mongoose.model('Post', postSchema);
