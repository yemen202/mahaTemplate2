import { Meteor } from 'meteor/meteor'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Core } from '/imports/api/lib/core.js'

export const Orders = new Mongo.Collection('orders')

// Define the schema
OrdersSchema = new SimpleSchema({
	userId: {
		type: String,
		regEx: SimpleSchema.RegEx.Id,
		optional: true,
	},
	code: {
		type: String,
		optional: true,
		autoValue: function() {
			if (this.isInsert) return Core.generateOrderCode()
		}
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
	'products.$.name': {
		type: String,
		optional: true
	},
	'products.$.categories': {
		type: [String],
		optional: true
	},
	'products.$.quantity': {
		type: Number,
		optional: true
	},
	'products.$.price': {
		type: Number,
		optional: true
	},
	'products.$.sellPrice': {
		type: Number,
		optional: true
	},
	'products.$.discount': {
		type: Number,
		optional: true
	},
	'products.$.options': {
		type: [Object],
		optional: true
	},
	'products.$.options.$.optionValueId': {
		type: String,
		regEx: SimpleSchema.RegEx.Id
	},
	'products.$.options.$.name': {
		type: String,
		optional: true
	},
	'products.$.options.$.value': {
		type: String,
		optional: true
	},
	subTotal: {
		type: Number,
		optional: true
	},
	deliveryCharge: {
		type: Number,
		optional: true
	},
	deliveryAddress: {
		type: Object,
		optional: true,
		blackbox: true
	},
	'deliveryAddress.$.firstName': {
		type: String,
		optional: true
	},
	'deliveryAddress.$.lastName': {
		type: String,
		optional: true
	},
	'deliveryAddress.$.addressId': {
		type: String,
		regEx: SimpleSchema.RegEx.Id
	},
	'deliveryAddress.$.mobile': {
		type: String,
		optional: true
	},
	'deliveryAddress.$.address': {
		type: String,
		optional: true
	},
	'deliveryAddress.$.area': {
		type: String,
		optional: true
	},
	'deliveryAddress.$.city': {
		type: String,
		optional: true
	},
	'deliveryAddress.$.pincode': {
		type: String,
		optional: true
	},
	'deliveryAddress.$.country': {
		type: String,
		optional: true
	},
	totalPrice: {
		type: Number,
		optional: true
	},
	totalDiscount: {
		type: Number,
		optional: true
	},
	status: {
	  type: String,
	  optional: true,
	  defaultValue: 'Placed' // Placed, Cancelled, Delivered
	},
	paymentId: {
		type: String,
		optional: true
	},
	paymentType: {
		type: String,
		optional: true
	},
	paymentStatus: {
		type: String,
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
Orders.attachSchema(OrdersSchema)
