import { Meteor } from 'meteor/meteor'
import { Options } from './collection'
import { OptionValues } from '/imports/api/optionValues/collection'
import { Products } from '/imports/api/products/collection'

Meteor.publish('options', function (filters, options) {
  if (!this.userId) {
    return this.ready()
  }

  if (!filters) filters = {}
  if (!options) options = {}

  return Options.find(filters, options)
})


Meteor.publishComposite('option.byId', function (optionId) {
  if (!this.userId) {
    return this.ready()
  }

  return {
    find: function() {
      const query = { _id: optionId }
      const options = {}
      return Options.find(query, options)
    },
    children: [{
      find: function (option) {
        return OptionValues.find({ optionId: option._id })
      },
      children: [{
        find: function(optionValue) {
          return Products.find({ 'options.optionValueId': optionValue._id })
        }
      }]
    }]
  }
})
