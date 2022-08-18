export const notificationDefs = `
	
	type notificationData {
		_id: String
		message: String
		readby: [ID]
		createdAt: Date
	}

	type notificationWithCount {
		notifications: [notificationData],
		totalNotification: Int
	}

	extend type Query {
		getNotifications (userId: ID, limit: Int, skip: Int): notificationWithCount
		notificationCount (userId: ID): Int
	}
`
