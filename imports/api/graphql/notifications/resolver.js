import { Meteor } from 'meteor/meteor'
import { Notifications } from '/imports/api/notifications/collection.js'

export const notificationResolvers = {
	Query: {
    getNotifications(root, args, context) {
    	let userId = args.userId
			if (context.user) userId = context.user._id
			if (userId) {
				//Update userId in notifications
				const notifications = Notifications.find({'readby': {$nin: [userId]}}, {}).fetch()
				if (notifications && notifications.length) {
					const notificationIds = _.pluck(notifications, '_id')
					_.each(notificationIds, (id) => {
						Notifications.update({_id: id}, {$push: {readby: userId}})
					})
				}

				const totalNotification = Notifications.find({}).count()
				const allNotifications = Notifications.find({}, {sort: {createdAt: -1}, skip: args.skip, limit: args.limit}).fetch()

	      return {notifications: allNotifications, totalNotification: totalNotification}
			} else {
				throw new Error('Invalid details')
			}
    },
    notificationCount(root, args, context) {
    	let userId = args.userId
			if (context.user) userId = context.user._id
			if (userId) {
				return Notifications.find({'readby': {$nin: [userId]}}).count()
			} else {
				throw new Error('Invalid details')
			}
    }
	}
}
