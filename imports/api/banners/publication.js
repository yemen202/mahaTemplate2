import { Meteor } from 'meteor/meteor'
import { Banners } from './collection'

Meteor.publish('banners', function(filters, options) {
  if (!this.userId) {
    return this.ready()
  }

  if (!filters) filters = {}
  if (!options) options = {}

  return Banners.find(filters, options)
})
