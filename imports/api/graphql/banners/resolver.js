import { Meteor } from 'meteor/meteor'
import { Banners } from '/imports/api/banners/collection.js'

export const bannersResolvers = {
	Query: {
	    getBanners(root, args, context) {
				return Banners.find({ visible: true }).fetch()
	    }
	}
}
