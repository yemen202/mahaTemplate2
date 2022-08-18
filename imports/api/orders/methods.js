import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { Roles } from 'meteor/alanning:roles'
import { Email } from 'meteor/email'
//
import { Orders } from '/imports/api/orders/collection'
import { Products } from '/imports/api/products/collection'
import { Addresses } from '/imports/api/addresses/collection'
import { Core } from '/imports/api/lib/core.js'

import webshot from 'webshot'
import fs from 'fs'
import Future from 'fibers/future'

//
Meteor.methods({
  'declineOrder' (id) {
    if (id) {
      const order = Orders.findOne({_id: id})
      if (!order) throw new Meteor.Error(403, 'Invalid order')
      //
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
      throw new Meteor.Error(403, 'Invalid details')
    }
  },
  'deliverOrder' (id) {
    if (id) {
      const order = Orders.findOne({_id: id})
      if (!order) throw new Meteor.Error(403, 'Invalid order')
      //
      const orderUpdated = Orders.update({_id: order._id}, { $set: { 'status': 'Delivered' } })
      if (orderUpdated) {
        const user = Meteor.users.findOne({_id: order.userId})
        if (user && user.emails && user.emails.length && user.emails.address) {
          const options = {
            to: user.emails.address,
            subject: 'Order Delivered',
						text: "Your order has been delivered to you."
          }
          try {
            return Email.send(options)
          } catch (err) {
            console.log(err)
          }
        }
      }
      return orderUpdated
    } else {
      throw new Meteor.Error(403, 'Invalid details')
    }
  },
  'generateOrderReceiptPDF' (id, windowWidth, windowHeight) {
    if (id) {
      var fileName = "generated_"+ Random.id() +".pdf"
      var fut = new Future()

  		windowWidth = windowWidth || 1024
  		windowHeight = windowHeight || 1080

      var options = {
        siteType: 'html',
    		// renderDelay: 1000,
    		windowSize: {
    			width: windowWidth,
    			height: windowHeight
    		},
    		shotSize: {
    			width: windowWidth,
    			height: 'all'
    		}
      }

      // GENERATE HTML STRING
      var css = Assets.getText('style.css')
      SSR.compileTemplate('layout', Assets.getText('layout.html'))
      Template.layout.helpers({
        getDocType: function() {
          return "<!DOCTYPE html>"
        }
      })
      SSR.compileTemplate('order_receipt', Assets.getText('order-receipt.html'))
      // PREPARE DATA
      var order = Orders.findOne({_id: id})
      if (order) {
        const user = Meteor.users.findOne({_id: order.userId})
        if (user) {
          order.user = user
          order.email = user.emails && user.emails[0] && user.emails[0].address ? user.emails[0].address : ''
        }

        order.createdAt = moment(order.createdAt).format('DD MMM YYYY h:mm A')
        order.products = _.map(order.products, (item) => {
          const product = Products.findOne({ _id: item.productId })
          item.productName = product ? product.name : (item.name ? item.name : 'PRODUCT')
          return item
        })
      }
      var data = { order: order }
      var html_string = SSR.render('layout', {
        css: css,
        template: "order_receipt",
        data: data
      })

      webshot(html_string, fileName, options, function(err) {
        fs.readFile(fileName, function (err,data) {
          if (err) {
            return console.log(err)
          }

          fs.unlinkSync(fileName)
          fut.return(data)
        })
      })

  		var pdfData = fut.wait()
  		var base64String = new Buffer(pdfData).toString('base64')

  		return base64String
    } else {
      throw new Meteor.Error(403, 'Invalid detail')
    }
  }
})
