import { Meteor } from 'meteor/meteor'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'

const Schema = {}
Schema.UserProfile = new SimpleSchema({
	name: {
		type: String,
		optional: true
	},
	photo: {
		type: String,
		optional: true
	},
	mobile: {
		type: String,
		optional: true
	},
	appToken: {
		type: String,
		optional: true
	},
	stripe: {
		type: Object,
		optional: true,
		blackbox: true
	}
})

Schema.User = new SimpleSchema({
	emails: {
		type: Array,
		optional: true
	},
	'emails.$': {
		type: Object
	},
	'emails.$.address': {
		type: String,
		regEx: SimpleSchema.RegEx.Email
	},
	'emails.$.verified': {
		type: Boolean
	},
	profile: {
		type: Schema.UserProfile,
		optional: true
	},
	addresses: {
		type: [String],
		optional: true
	},
	roles: {
		type: [Object],
		optional: true,
		blackbox: true
	},
	services: {
		type: Object,
		optional: true,
		blackbox: true
	},
	createdAt: {
		type: Date,
		optional: true,
		autoValue: function () {
			if (this.isInsert) {
				return new Date
			}
		}
	}
})

Meteor.users.attachSchema(Schema.User)
