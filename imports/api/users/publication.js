import { Meteor } from 'meteor/meteor'
import { Roles } from 'meteor/alanning:roles'

Meteor.publish('users', function (filters, options) {
  if (!this.userId) {
    return this.ready()
  }

  const userId = this.userId
  if (!filters) filters = {}
  if (!options) options = {}

  if (!options.fields || _.isEmpty(options.fields)) {
    options.fields = { 'emails': 1, 'profile': 1, 'roles': 1, 'createdAt': 1 }
  }
  return Meteor.users.find(filters, options)
})

Meteor.publish('roles', function() {
  if (!this.userId) {
    return this.ready()
  }
  return Meteor.roles.find({_id: {'$ne': 'admin'}}, { fields: { name: 1 } })
})
