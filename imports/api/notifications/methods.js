import { Meteor } from 'meteor/meteor'
import { Notifications } from '/imports/api/notifications/collection.js'

//
Meteor.methods({
  'addNotification' (data) {
    if (data && data.message) {
      //
      const notificationData = {
	      message: data.message
      }
      const notificationId = Notifications.insert(notificationData)
      return notificationId
    } else {
      throw new Meteor.Error(403, 'Invalid details')
    }
  },
  'editNotification' (data) {
    if (data && data.message) {
        //
        const updateData = {
          message: data.message
        }
        const notificationUpdated = Notifications.update({ _id: data._id }, {
          $set: updateData
        })
        return notificationUpdated

    } else {
      throw new Meteor.Error(403, 'Invalid details')
    }
  }
})
