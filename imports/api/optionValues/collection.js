import { Meteor } from 'meteor/meteor'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'

export const OptionValues = new Mongo.Collection('optionValues')

// Define the schema
OptionValuesSchema = new SimpleSchema({
  value: {
    type: String,
    optional: false
  },
  optionId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
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
OptionValues.attachSchema(OptionValuesSchema)
