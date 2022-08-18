import { Meteor } from 'meteor/meteor'
import { OptionValues } from './collection'

Meteor.publish('optionValues', function (filters, options) {
  if (!this.userId) {
    return this.ready()
  }

  if (!filters) filters = {}
  if (!options) options = {}

  return OptionValues.find(filters, options)
})
