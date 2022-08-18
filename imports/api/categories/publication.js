import { Meteor } from 'meteor/meteor'
import { Categories } from './collection'

Meteor.publish('categories', function(filters, options) {
  if (!this.userId) {
    return this.ready()
  }

  if (!filters) filters = {}
  if (!options) options = {}

  return Categories.find(filters, options)
})
