import { Meteor } from 'meteor/meteor'
import { Products } from './collection'
import { OptionValues } from '/imports/api/optionValues/collection'

Meteor.publish('products', function (filters, options) {
  if (!this.userId) {
    return this.ready()
  }

  if (!filters) filters = {}
  if (!options) options = {}

  return Products.find(filters, options)
})
