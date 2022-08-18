import { Meteor } from 'meteor/meteor'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'

export const Categories = new Mongo.Collection('categories')

// Define the schema
CategoriesSchema = new SimpleSchema({
	name: {
		type: String,
		optional: false
	},
	photo: {
		type: String,
		optional: true
	},
	parentId: {
		type: String,
    regEx: SimpleSchema.RegEx.Id,
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
Categories.attachSchema(CategoriesSchema)
