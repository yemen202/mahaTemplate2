import { Meteor } from 'meteor/meteor'
import { Carts } from '/imports/api/carts/collection'
import { Products } from '/imports/api/products/collection'
import { Settings } from '/imports/api/settings/collection'
import { OptionValues } from '/imports/api/optionValues/collection'
import { Options } from '/imports/api/options/collection'
import { Core } from '/imports/api/lib/core.js'

export const cartResolvers = {
	Query: {
		getCartDetails(root, args, context) {
			let userId = args.userId
			if (context.user) userId = context.user._id
			if (userId) {
				var cart = Carts.findOne({userId: userId})
				if (cart) {
					cart.freeOrderDeliveryLimit = 0
					cart.deliveryCharge = 0
					if (cart && cart.products && cart.products.length) {
						cart.products = _.map(cart.products, (item) => {
							const product = Products.findOne({_id: item.productId})
							if (product) {
								item.name = product.name
								item.price = product.price
								item.specialPrice = product.specialPrice
								item.maxQuantity = product.quantity
								item.photos = product.photos
								item.optionValues = []
								if(item.optionValueIds && item.optionValueIds.length > 0) {
									_.map(item.optionValueIds, optionValue => {
										const opValue = OptionValues.findOne({ _id: optionValue })
										if(opValue && opValue.optionId) {
											const op = Options.findOne({ _id: opValue.optionId })
											const productOption = product.options.find(option => option.optionValueId === optionValue)
											item.optionValues.push({
												_id: opValue._id,
												value: opValue.value,
												name: op.name,
												quantity: productOption && productOption.quantity || 0,
												price: productOption && productOption.price || 0,
												pricePrefix: productOption && productOption.pricePrefix || 'plus'
											})
										}
									})
								}
							}
							return item
						})
					}

					const deliveryLimit = Settings.findOne({_id: 'Free_Order_Delivery_Limit'})
					if (deliveryLimit && deliveryLimit.value) cart['freeOrderDeliveryLimit'] = deliveryLimit.value

					const deliveryCharge = Settings.findOne({_id: 'Delivery_Charge'})
					if (deliveryCharge && deliveryCharge.value) cart['deliveryCharge'] = deliveryCharge.value

					return cart
				} else {
					throw new Error('Cart not found')
				}
			} else {
				throw new Error('Invalid details')
			}
		},
		isCartProductsAvailable(root, args, context) {
			let userId = args.userId
			if (context.user) userId = context.user._id
			if (userId) {
				var cart = Carts.findOne({userId: userId})
				if (cart) {
					_.each(cart.products, (item) => Core.isProductAvailable(item, cart.products))
					return true
				} else {
					throw new Error('Cart not found')
				}
			} else {
				throw new Error('Invalid details')
			}
		}
	},
	Mutation: {
		updateCart(root, args, context) {
			let userId = args.userId
			if (context.user) userId = context.user._id
			if (userId) {
				var cart = Carts.findOne({userId: userId})
				if (cart) {

					//
					function isProduct (productId, optionValueIds, itemproductId, itemOptionValueIds) {
						if(itemproductId === productId) {
							if(optionValueIds && optionValueIds.length > 0) {
								if(itemOptionValueIds && itemOptionValueIds.length > 0 && _.isEqual(optionValueIds, itemOptionValueIds)) return true
							} else if(!itemOptionValueIds || (itemOptionValueIds && itemOptionValueIds.length == 0)) return true
						}
					}
					//

					const product = Products.findOne({_id: args.productId})
					const optionValueIds = args.optionValueIds || []
					const isProductAvailable = _.find(cart.products, (item) => isProduct(args.productId, optionValueIds, item.productId, item.optionValueIds))
					if (!_.isEmpty(isProductAvailable)) {
						var updatedProduct = []
						if (args.quantity > 0) {
							updatedProduct = _.map(cart.products, (item) => {
								if(isProduct(args.productId, optionValueIds, item.productId, item.optionValueIds)) item.quantity = args.quantity
								return item
							})
						} else {
							updatedProduct = _.reject(cart.products, function(item) {
								return isProduct(args.productId, optionValueIds, item.productId, item.optionValueIds)
						  })
						}

						return Carts.update({userId: userId}, {$set: {products: updatedProduct}})
					} else {
						const product = {productId: args.productId, quantity: args.quantity}
						if(args.optionValueIds && args.optionValueIds.length > 0) product['optionValueIds'] = args.optionValueIds
						return Carts.update({userId: userId}, {$push: {products: product}})
					}
				} else {
					if (args.quantity > 0) {
						const product = Products.findOne({_id: args.productId})
						if(product && product._id) {
							const cartData = {
								userId: userId,
								products: [{ productId: args.productId, quantity: args.quantity }]
							}
							if(args.optionValueIds && args.optionValueIds.length > 0) cartData.products[0]['optionValueIds'] = args.optionValueIds
							Carts.insert(cartData)
							return true
						} else {
							throw new Error('Invalid details')
						}
					} else {
						throw new Error('Invalid details')
					}
				}
			} else {
				throw new Error('Invalid details')
			}
		}
	}
}
