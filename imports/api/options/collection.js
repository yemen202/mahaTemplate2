import { Meteor } from 'meteor/meteor'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'

export const Options = new Mongo.Collection('options')

// Define the schema
OptionsSchema = new SimpleSchema({
	name: {
		type: String,
		optional: false
	},
	type: {
		type: String,
		optional: false
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
Options.attachSchema(OptionsSchema)
