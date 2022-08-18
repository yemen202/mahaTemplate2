import { Meteor } from 'meteor/meteor'
import { Settings } from './collection'

Meteor.publish('settings', function () {
  if (!this.userId) {
    return this.ready()
  }
  return Settings.find()
})
