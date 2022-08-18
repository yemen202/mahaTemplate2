import { Meteor } from 'meteor/meteor'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'

export const Carts = new Mongo.Collection('carts')

// Define the schema
CartsSchema = new SimpleSchema({
	userId: {
		type: String,
		regEx: SimpleSchema.RegEx.Id,
		optional: true,
	},
	products: {
		type: [Object],
		optional: true,
		blackbox: true
	},
	'products.$.productId': {
		type: String,
		regEx: SimpleSchema.RegEx.Id
	},
	'products.$.quantity': {
		type: Number,
		optional: true,
		decimal: true
	},
	'products.$.optionValueIds': {
		type: [String],
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
Carts.attachSchema(CartsSchema)
