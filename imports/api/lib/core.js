import { HTTP } from 'meteor/http'
import { Products } from '/imports/api/products/collection'
import { Options } from '/imports/api/options/collection'
import { OptionValues } from '/imports/api/optionValues/collection'
import { Orders } from '/imports/api/orders/collection'

var stripe = ''

if (Meteor.isServer) {
	stripe = require('stripe')(Meteor.settings.stripe.secretKey);
}

const validateTokenUser = (user) => {
	if (user === null) {
		throw new Error("Token is required");
	} else if (user == false) {
		throw new Error("Invalid auth token");
	} else {
		return user;
	}
}
//
function validateEmail(email) {
	var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
	return regex.test(email);
}
//
const generateOrderCode = (length) => {
	if (!length) length = 6;
	const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	var result = "";
	for (var i = length; i > 0; --i)
		result += chars[Math.round(Math.random() * (chars.length - 1))]

	if (Orders.findOne({'code': result})) generateOrderCode()

	return result
}
//
const isProductAvailable = (item, cartProducts) => {
	const prod = Products.findOne({_id: item.productId})
	if(prod) {
		var optionValues = [], optionsCount = 0
		if(prod.options && prod.options.length > 0) {
			optionValues = OptionValues.find({ _id: { $in:  _.pluck(_.filter(prod.options, option => option.quantity > 0), 'optionValueId') }}).fetch()
			optionsCount = Options.find({ _id: { $in: _.uniq(_.pluck(optionValues, 'optionId')) }}).count()
		}
		if((optionValues.length > 0 && (!item.optionValueIds || item.optionValueIds.length == 0))
			|| (optionValues.length == 0 && (item.optionValueIds && item.optionValueIds.length > 0))
			|| (item.optionValueIds && item.optionValueIds.length !== optionsCount)) {
			throw new Error('Please remove ' + prod.name + ' from cart and add again')
		}

		var cartProductQty = 0, itemOptionValues = []
		if(item.optionValueIds && item.optionValueIds.length > 0) {
			_.each(item.optionValueIds, opId => {
				const prodOption = _.find(prod.options, option => option.optionValueId === opId)
				itemOptionValues.push({ _id: opId, quantity: prodOption && prodOption.quantity || 0 })
			})
		}

		for(let i = 0; i < cartProducts.length; i++) {
			if(cartProducts[i].productId === prod._id) {
				cartProductQty = cartProductQty + cartProducts[i].quantity

				if(cartProducts[i].optionValueIds && cartProducts[i].optionValueIds.length > 0) {
					itemOptionValues.map((optionValue) => {
	          const isOption = _.contains(cartProducts[i].optionValueIds, optionValue._id)
	          if(isOption) optionValue.quantity = optionValue.quantity - cartProducts[i].quantity
	        })
	      }
			}
		}

		var minOptQty = undefined
	  if(itemOptionValues && itemOptionValues.length > 0) minOptQty = _.min(_.pluck(itemOptionValues, 'quantity'))
		if((cartProductQty > prod.quantity) || (!_.isUndefined(minOptQty) && minOptQty < 0)) {
	    const availableProQty = item.quantity - (cartProductQty - prod.quantity) > 0 ? item.quantity - (cartProductQty - prod.quantity) : 0
			const optQty = item.quantity - Math.abs(minOptQty) > 0 ? item.quantity - Math.abs(minOptQty) : 0

			var msgText = ''
			if(itemOptionValues && itemOptionValues.length > 0) {
				_.each(itemOptionValues, optValue => {
					const opValue = OptionValues.findOne({ _id: optValue._id })
					const op = Options.findOne({ _id: opValue.optionId })
					msgText += (msgText == '' ? `for ${op.name} - ${opValue.value}` : `, ${op.name} - ${opValue.value}`)
				})
			}
			throw new Error(`${!_.isUndefined(minOptQty) ? (optQty < availableProQty ? optQty : availableProQty) : availableProQty} quantities available for ${prod.name} ${msgText}` )
	  }

		return true

	} else {
		throw new Error(prod.name + " is not available. Please remove it from your cart")
	}
}
//
const stripePaymentFn = (data) => {
	const user = data.user
	function payment(customerId, tokenId) {
		try {
			const customerSource = Meteor.wrapAsync(stripe.customers.createSource, stripe.customers);
			const source = customerSource(customerId, { source: tokenId })
			if(source && source.id) {
				const charge = {
					amount: data.amount * 100, // Unit: cents
					currency: 'usd',
					customer:  customerId,
					source: source.id
				}
				const handleCharge = Meteor.wrapAsync(stripe.charges.create, stripe.charges);
				const payment = handleCharge(charge);
				if(payment && payment.id && payment.paid) return payment.id
			}
			return null
		} catch (err) {
			return null
		}
	}

	if (user && user.profile && user.profile.stripe && user.profile.stripe.customerId) {
		return payment(user.profile.stripe.customerId, data.token)
	} else {
		try {
			const customerData = {
				name: user.profile.name,
				email: user.emails && user.emails[0] && user.emails[0].address ? user.emails[0].address : ''
			}
			const stripeCustomer = Meteor.wrapAsync(stripe.customers.create, stripe.customers);
			const customer = stripeCustomer(customerData);
			if (customer && customer.id) {
	  		Meteor.users.update({ _id: user._id }, { $set: { 'profile.stripe': { 'customerId': customer.id } } })
	  		return payment(customer.id, data.token)
	  	}
			return false
		} catch (err) {
			return false
		}
  }
}

const paypalPaymentFn = (orderId) => {
	if(orderId) {
		try {
			const apiUrl = Meteor.settings && Meteor.settings.paypal && Meteor.settings.paypal.apiUrl ?  Meteor.settings.paypal.apiUrl : ''
			const accessKeyId = Meteor.settings && Meteor.settings.paypal && Meteor.settings.paypal.accessKeyId ?  Meteor.settings.paypal.accessKeyId : ''
			const secretAccessKey = Meteor.settings && Meteor.settings.paypal && Meteor.settings.paypal.secretAccessKey ?  Meteor.settings.paypal.secretAccessKey : ''
			const response = HTTP.call("POST", `${apiUrl}/v2/checkout/orders/${orderId}/capture`, {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Basic '+ Buffer.from(`${accessKeyId}:${secretAccessKey}`).toString('base64')
				},
				data: {}
			})
			if(response && response.data && response.data.status == "COMPLETED") {
				return response.data.purchase_units && response.data.purchase_units[0] && response.data.purchase_units[0].payments && response.data.purchase_units[0].payments.captures
					&& response.data.purchase_units[0].payments.captures[0] && response.data.purchase_units[0].payments.captures[0].id ? response.data.purchase_units[0].payments.captures[0].id : null
			}
		} catch(err) {
			return null
		}
	}
	return null
}

const paypalPaymentRefundFn = (paymentId) => {
	if(paymentId) {
		try {
			const apiUrl = Meteor.settings && Meteor.settings.paypal && Meteor.settings.paypal.apiUrl ?  Meteor.settings.paypal.apiUrl : ''
			const accessKeyId = Meteor.settings && Meteor.settings.paypal && Meteor.settings.paypal.accessKeyId ?  Meteor.settings.paypal.accessKeyId : ''
			const secretAccessKey = Meteor.settings && Meteor.settings.paypal && Meteor.settings.paypal.secretAccessKey ?  Meteor.settings.paypal.secretAccessKey : ''
			const response = HTTP.call("POST", `${apiUrl}/v2/payments/captures/${paymentId}/refund`, {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Basic '+ Buffer.from(`${accessKeyId}:${secretAccessKey}`).toString('base64')
				},
				data: {}
			})
			if(response && response.data && response.data.status == "COMPLETED") return true
		} catch(err) {
			return false
		}
	}
	return false
}

const stripePaymentRefundFn = (paymentId) => {
	if(paymentId) {
		try {
			const handleRefund = Meteor.wrapAsync(stripe.refunds.create, stripe.refunds);
			const res = handleRefund({ charge: paymentId })
			if(res && res.status && (res.status === 'succeeded' || res.status === 'pending')) return true
		} catch(err) {
			return false
		}
	}
	return false
}

module.exports.Core = {
	validateTokenUser,
	validateEmail,
	generateOrderCode,
	isProductAvailable,
	stripePaymentFn,
	paypalPaymentFn,
	paypalPaymentRefundFn,
	stripePaymentRefundFn
}
