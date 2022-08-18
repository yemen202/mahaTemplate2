import { Meteor } from 'meteor/meteor'
import { Notifications } from './collection'

Meteor.publish('notifications', function(filters, options) {
  if (!this.userId) {
    return this.ready()
  }

  if (!filters) filters = {}
  if (!options) options = {}

  return Notifications.find(filters, options)
})
