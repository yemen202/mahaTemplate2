import { Meteor } from 'meteor/meteor'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'

export const Addresses = new Mongo.Collection('addresses')

// Define the schema
AddressesSchema = new SimpleSchema({
  firstName: {
		type: String,
		optional: true
	},
  lastName: {
    type: String,
		optional: true
  },
  mobile: {
		type: String,
		optional: false
	},
  email: {
		type: String,
    regEx: SimpleSchema.RegEx.Email,
		optional: true
	},
	address: {
		type: String,
		optional: false
	},
	area: {
		type: String,
		optional: false,
	},
	city: {
		type: String,
		optional: false
	},
  pincode: {
    type: String,
		optional: false
  },
	country: {
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
Addresses.attachSchema(AddressesSchema)
