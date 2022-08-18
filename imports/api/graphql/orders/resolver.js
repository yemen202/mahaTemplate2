import { Meteor } from 'meteor/meteor'
import { Orders } from '/imports/api/orders/collection.js'
import { Products } from '/imports/api/products/collection.js'
import { Options } from '/imports/api/options/collection.js'
import { OptionValues } from '/imports/api/optionValues/collection.js'
import { Carts } from '/imports/api/carts/collection.js'
import { Addresses } from '/imports/api/addresses/collection'
import { Core } from '/imports/api/lib/core.js'

export const orderResolvers = {
	Query: {
		getOrders(root, args, context) {
			const user = Core.validateTokenUser(context.user)
			if (user) {
				var query = { userId: user._id }
				if(args && args.status) query['status'] = args.status
				const totalOrder = Orders.find(query).count()
				var orders = Orders.find(query, {sort: {createdAt: -1}, skip: args.skip, limit: args.limit}).fetch()
				orders = _.map(orders, (order) => {
					if(order && order.products && order.products.length) {
						order.products = _.map(order.products, (item) => {
							const product = Products.findOne({_id: item.productId})
							item.photos = product && product.photos ? product.photos : []
							return item
						})
					}
					return order
				})
				return {orders: orders, totalOrder: totalOrder}
			} else {
				throw new Error('User not found')
			}
		},
		getOrderDetails(root, args, context) {
			if (args && args.orderId) {
				var order = Orders.findOne({_id: args.orderId})
				if (order) {
					if (order && order.products && order.products.length) {
						order.products = _.map(order.products, (item) => {
							const product = Products.findOne({_id: item.productId})
							item.photos = product && product.photos ? product.photos : []
							return item
						})
					}
				}
				return order
			} else {
				throw new Error('Invalid details')
			}
		}
	},
	Mutation: {
		placeOrder(root, args, context) {
			const user = Core.validateTokenUser(context.user)
			if (user) {

				var products = []
				if(!args.type || (args.type && args.type == 'cartOrder')) {
					var cart = Carts.findOne({userId: user._id})
					if(!cart) throw new Error('Cart is empty')
					products = cart.products ? cart.products : []
				} else if(args.type == 'quickBuyOrder' && args.product && args.product.productId) {
					products = [args.product]
				} else {
					throw new Error('Unable to place order')
				}

				if (!args.paymentType) throw new Error('Payment required')

				var productsData = [];

				_.each(products, (item) => {
						const isProductAvailable = Core.isProductAvailable(item, products)
						if(isProductAvailable) {
							const prod = Products.findOne({_id: item.productId})
							var options = [], optionValuesPriceTotal = 0
							if(item.optionValueIds && item.optionValueIds.length > 0) {
								_.map(item.optionValueIds, optionValue => {
									const opValue = OptionValues.findOne({ _id: optionValue })
									if(opValue && opValue.optionId) {
										const op = Options.findOne({ _id: opValue.optionId })
										options.push({ optionValueId: opValue._id, value: opValue.value, name: op.name })
										const productOption = prod.options.find(option => option.optionValueId === optionValue)
										if(productOption && productOption.price && productOption.price > 0) {
											optionValuesPriceTotal = productOption.pricePrefix && productOption.pricePrefix == 'minus' ? optionValuesPriceTotal - productOption.price : optionValuesPriceTotal + productOption.price
										}
									}
								})
							}
							var productSellPrice = prod.specialPrice + optionValuesPriceTotal
							var productObj = {
								productId: item.productId,
								quantity: item.quantity,
								name: prod.name,
								categories: prod.categories,
								price: productSellPrice > prod.price ? productSellPrice * item.quantity : prod.price * item.quantity,
								discount: productSellPrice > prod.price ? 0 : (prod.price - (productSellPrice > 0 ? productSellPrice : 0)) * item.quantity,
								sellPrice: productSellPrice * item.quantity > 0 ? productSellPrice * item.quantity : 0,
								options
							}

							productsData.push(productObj)
						} else throw new Error('Unable to place order as some products not available in desired quantity')
				})

				const orderData = {
					userId: user._id,
					products: productsData,
					deliveryCharge: args.deliveryCharge,
					subTotal: args.subTotal,
					totalPrice: args.totalPrice
				}

				if (args.totalDiscount) orderData['totalDiscount'] = args.totalDiscount

				if (args.addressId) {
					const address = Addresses.findOne(args.addressId)
					if(address && address._id) {
						orderData['deliveryAddress'] = {
							addressId: address._id,
							firstName: address.firstName || '',
							lastName: address.lastName || '',
							mobile: address.mobile || '',
							address: address.address || '',
							area: address.area || '',
							city: address.city || '',
							pincode: address.pincode || '',
							country: address.country || ''
						}
					}
				}

				//
				function placeOrder (orderData) {
					const orderId = Orders.insert(orderData)
					if (orderId) {
						_.each(orderData.products, (item) => {
							Products.update({ _id: item.productId }, { $inc: { quantity: -(item.quantity) } })
							if(item.options && item.options.length > 0) {
								_.each(_.pluck(item.options, 'optionValueId'), optionValueId => {
									Products.update({ _id: item.productId, 'options.optionValueId': optionValueId }, { $inc: { 'options.$.quantity': -(item.quantity) }})
								})
							}
						})
					}
					if(!args.type || (args.type && args.type == 'cartOrder')) Carts.update({ userId: user._id }, { $set: { products: [] } })
					return true
				}
				//
				if (args.paymentType === 'stripe') {
					paymentData = {
						amount: args.totalPrice,
						token: args.tokenId,
						user: user
					}
					const paymentId = Core.stripePaymentFn(paymentData)
					if (paymentId) {
						orderData['paymentId'] = paymentId
						orderData['paymentStatus'] = 'paid'
						orderData['paymentType'] = 'stripe'
						return placeOrder(orderData)
					} else {
						throw new Error('Unable to process payment..please try again')
					}
				} else if (args.paymentType === 'paypal') {
					const paymentId = Core.paypalPaymentFn(args.tokenId)
					if(paymentId) {
						orderData['paymentId'] = paymentId
						orderData['paymentStatus'] = 'paid'
						orderData['paymentType'] = 'paypal'
						return placeOrder(orderData)
					} else {
						throw new Error('Unable to process payment..please try again')
					}
				} else if (args.paymentType === 'cod') {
					orderData['paymentStatus'] = 'unpaid'
					orderData['paymentType'] = 'cod'
					return placeOrder(orderData)
				} else {
					throw new Error('Payment type required')
				}
			} else {
				throw new Error('User not found')
			}
		},
		cancelOrder(root, args, context) {
			const user = Core.validateTokenUser(context.user)
			if(user && user._id) {
				if(args && args.orderId) {
					var order = Orders.findOne({ _id: args.orderId })
					if(order && order.userId && order.userId == user._id) {
						if(order.status && order.status == 'Placed') {
							function cancelOrder () {
								if(order.products && order.products.length > 0) {
									_.each(order.products, (product) => {
										const prod = Products.findOne({_id: product.productId})
										if(prod && prod._id && product.quantity) {
											Products.update({ _id: product.productId }, { $inc: { quantity: product.quantity } })
											if(product.options && product.options.length > 0) {
												_.each(_.pluck(product.options, 'optionValueId'), optionValueId => {
													Products.update({ _id: product.productId, 'options.optionValueId': optionValueId }, { $inc: { 'options.$.quantity': product.quantity }})
												})
											}
										}
									})
								}
								return Orders.update({ _id: order._id }, { $set: { 'status': 'Cancelled' } })
							}
							if(order.paymentType == 'paypal' && order.paymentStatus == 'paid' && order.paymentId) {
								const isPaymentRefund = Core.paypalPaymentRefundFn(order.paymentId)
								if(isPaymentRefund) return cancelOrder()
							} else if(order.paymentType == 'stripe' && order.paymentStatus == 'paid' && order.paymentId) {
								const isPaymentRefund = Core.stripePaymentRefundFn(order.paymentId)
								if(isPaymentRefund) return cancelOrder()
							} else if (order.paymentType == 'cod') {
								return cancelOrder()
							}
						} else {
							throw new Error('Unable to cancel order')
						}
					} else {
						throw new Error('This order does not belong to you')
					}
				} else {
					throw new Error('Order not found')
				}
			} else {
				throw new Error('User not found')
			}
		}
	}
}
