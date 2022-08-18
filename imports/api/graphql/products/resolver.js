import { Meteor } from 'meteor/meteor'
import { Promise } from 'meteor/promise';
import { Products } from '/imports/api/products/collection.js'
import { Categories } from '/imports/api/categories/collection.js'
import { Options } from '/imports/api/options/collection.js'
import { OptionValues } from '/imports/api/optionValues/collection.js'
import { Orders } from '/imports/api/orders/collection.js'
import { Settings } from '/imports/api/settings/collection'

export const productResolvers = {
	Query: {
		getProducts(root, args, context) {
			var options = { skip: args.skip, limit: args.limit }, totalProduct = 0, products = []
			if(!args.sortBy) options['sort'] = { popular: -1 }

			if(args.sortBy === 'HTL') options['sort'] = { specialPrice: -1 }
			else if(args.sortBy === 'LTH') options['sort'] = { specialPrice: 1 }
			else if(args.sortBy === 'popularity') options['sort'] = { popular: -1 }
			else if(args.sortBy === 'alphabetical') options['sort'] = { name: 1 }

			//
			var query = {'$and': [{ 'visible': true }]}

			if(args.categoryId) query['$and'].push({ 'categories': args.categoryId })

			if(args.type) {
				if(args.type == 'popular') {
					query['$and'].push({ 'popular': true })
				} else if(args.type === 'special') {
					query['$and'].push({ $expr: { $gt: [ "$price" , "$specialPrice" ] }})
				} else if(args.type == 'similar' && args.productId) {
					const prod = Products.findOne({ _id: args.productId })
					const productIds = prod && prod.similarProducts && prod.similarProducts.length > 0 ? prod.similarProducts : []
					query['$and'].push({ '_id': { $in: productIds } })
				} else if(args.type == 'bestSelling') {
					//last month best selling products
					var date = new Date();
					date.setMonth(date.getMonth() - 1); 
					const bestSellingProducts = Promise.await(Orders.aggregate([
						{ $unwind: "$products" },
						{ $match: { createdAt: { $gte: date } }},
						{ $group: { "_id": "$products.productId", "total_sold": { $sum: "$products.quantity" }}},
						{ $sort: { "total_sold": -1 }}
					]).toArray())

					if(bestSellingProducts && bestSellingProducts.length > 0) {
						const bestSellingProductIds = _.pluck(bestSellingProducts, '_id')
						query['$and'].push({ '_id': { $in: bestSellingProductIds } })
					}
				}
			}

			if (args.search) {
				const searchQuery = { '$or': [{ 'name': new RegExp(".*" + args.search.trim().replace(/(\W)/g, "\\$1") + ".*", "i") }] }
				const categories = Categories.find({ 'name': new RegExp(".*" + args.search.trim().replace(/(\W)/g, "\\$1") + ".*", "i") }).fetch()
				if(categories && categories.length > 0) searchQuery['$or'].push({ 'categories': { $in: _.pluck(categories, '_id') }})
				query['$and'].push(searchQuery)
			}

			if (args.filter && args.filter.priceRange && args.filter.priceRange.length > 0) {
				const searchQuery = { '$or': [] }
				args.filter.priceRange.forEach((range, i) => {
					if(range.minPrice && range.maxPrice) searchQuery['$or'].push({ 'specialPrice': { $gte: range.minPrice, $lte: range.maxPrice }})
					else if(range.minPrice) searchQuery['$or'].push({ 'specialPrice': { $gte: range.minPrice }})
					else if(range.maxPrice) searchQuery['$or'].push({ 'specialPrice': { $lte: range.maxPrice }})
				});
				query['$and'].push(searchQuery)
			}

			if (args.filter && args.filter.discount && args.filter.discount.type && !_.isUndefined(args.filter.discount.value)) {
				args.filter.discount.type == 'minimum' ? query['$and'].push({ 'discount': { $gte: args.filter.discount.value } }) : query['$and'].push({ 'discount': { $gt: 0, $lte: args.filter.discount.value } })
				//total product
				const res = Promise.await(Products.aggregate([
					{ $project: {
							visible: 1, categories: 1, price: 1, specialPrice: 1, popular: 1,
							discount: { $subtract: [100, { $divide: [{ $multiply: ["$specialPrice", 100] }, "$price" ] }] }
						}
					},
					{ $match: query },
					{ $count: "totalProducts" }
				]).toArray())
				totalProduct = res && res[0] && res[0].totalProducts ? res[0].totalProducts : 0

				//products
				products = Promise.await(Products.aggregate([
					{ $project: {
							name: 1, visible: 1, categories: 1, price: 1, specialPrice: 1, photos: 1, popular: 1,
							discount: { $subtract: [100, { $divide: [{ $multiply: ["$specialPrice", 100] }, "$price" ] }] }
						}
					},
					{ $match: query },
					{ $skip : args.skip },
					{ $limit: args.limit },
					{ $sort: options.sort }
				]).toArray())
			} else {
				totalProduct = Products.find(query).count()
				products = Products.find(query, options).fetch()
			}

			return { products: products, totalProduct: totalProduct }
		},
		getProductDetails(root, args, context) {
			if(args.productId) {
				const product = Products.findOne({ _id: args.productId })
				if(product && product._id) {
					if(product.similarProducts && product.similarProducts.length > 0) {
						product.similarProducts = Products.find({ _id: { $in: product.similarProducts }, visible: true }, { skip: 0, limit: 2 })
					}
					if(product.options && product.options.length > 0) {
						const values = _.filter(product.options, option => option.quantity > 0)
						const optionValues = OptionValues.find({ _id: { $in:  _.pluck(values, 'optionValueId') }}).fetch()
						const options = Options.find({ _id: { $in: _.uniq(_.pluck(optionValues, 'optionId')) }})
						product.options = options.map(option => {
							option.optionValues = _.map(optionValues.filter(value => value.optionId === option._id), item => {
								var value = _.find(values, value => value.optionValueId === item._id)
								if(value) {
									item.quantity = value.quantity
									item.price = value.price || 0
									if(value.pricePrefix) item.pricePrefix = value.pricePrefix
								}
								return item
							})
							return option
						})
					}

					const deliveryLimit = Settings.findOne({_id: 'Free_Order_Delivery_Limit'})
					if (deliveryLimit && deliveryLimit.value) product.freeOrderDeliveryLimit = deliveryLimit.value

					const deliveryCharge = Settings.findOne({_id: 'Delivery_Charge'})
					if (deliveryCharge && deliveryCharge.value) product.deliveryCharge = deliveryCharge.value

					return product
				} else {
					throw new Error('Invalid product')
				}
			} else {
				throw new Error('Invalid product')
			}
		}
	}
}
