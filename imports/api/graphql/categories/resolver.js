import { Meteor } from 'meteor/meteor'
import { Categories } from '/imports/api/categories/collection'

export const categoriesResolvers = {
	Query: {
		getCategories(root, args, context) {
			var filters = { parentId: null }, options = { sort: { createdAt: 1 }}
			if(args.categoryId) filters = { parentId: { $eq: args.categoryId }}
			if(!_.isUndefined(args.skip) && !_.isUndefined(args.limit)) options.skip = args.skip, options.limit = args.limit

			var totalCategory = Categories.find(filters).count()
			var categories = Categories.find(filters, options).fetch()

			return { categories: categories, totalCategory: totalCategory }
		}
	}
}
