import { Meteor } from 'meteor/meteor'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'

export const Products = new Mongo.Collection('products')

// Define the schema
ProductsSchema = new SimpleSchema({
	name: {
		type: String,
		optional: false
	},
	categories: {
		type: [String],
		optional: true,
	},
	shortDescription: {
		type: String,
		optional: true
	},
	description: {
		type: String,
		optional: true
	},
	price: {
		type: Number,
		optional: true
	},
	specialPrice: {
		type: Number,
		optional: true
	},
	photos: {
		type: Array,
		optional: true,
		blackbox: true
	},
	'photos.$': {
		type: String
	},
	popular: {
		type: Boolean,
		optional: true
	},
	quantity: {
		type: Number,
		optional: true
	},
	visible: {
		type: Boolean,
		optional: true
	},
	similarProducts: {
		type: [String],
		optional: true,
		regEx: SimpleSchema.RegEx.Id
	},
	options: {
		type: [Object],
		optional: true,
		blackbox: false
	},
	'options.$.optionValueId': {
		type: String,
		regEx: SimpleSchema.RegEx.Id
	},
	'options.$.quantity': {
		type: Number,
		optional: true
	},
	'options.$.pricePrefix': {
		type: String,
		optional: true
	},
	'options.$.price': {
		type: Number,
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
Products.attachSchema(ProductsSchema)
