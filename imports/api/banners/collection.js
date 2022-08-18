import { Meteor } from 'meteor/meteor'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'

export const Banners = new Mongo.Collection('banners')

// Define the schema
BannersSchema = new SimpleSchema({
	photo: {
		type: String,
		optional: false
	},
	visible: {
		type: Boolean,
		optional: true
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
Banners.attachSchema(BannersSchema)
