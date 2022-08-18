import { Meteor } from 'meteor/meteor'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'

export const Notifications = new Mongo.Collection('notifications')

// Define the schema
NotificationsSchema = new SimpleSchema({
	message: {
		type: String,
		optional: true
	},
	readby: {
		type: Array,
		optional: true,
		blackbox: true
	},
	'readby.$': {
		type: String,
		regEx: SimpleSchema.RegEx.Id,
		optional: true,
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
Notifications.attachSchema(NotificationsSchema)