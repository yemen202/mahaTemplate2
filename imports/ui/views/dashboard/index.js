import { Template } from 'meteor/templating'
import { Roles } from 'meteor/alanning:roles'
import { Orders } from '/imports/api/orders/collection'
import { Settings } from '/imports/api/settings/collection'

import './index.html'

projectStock = new Mongo.Collection('projectStock')

Template.dashboard.onCreated(function () {
  const self = this

  self.autorun(function () {
    self.subscribe("ordersForCount")
  })
})

Template.dashboard.helpers({
  productStockAlerts () {
    return projectStock.find({}).fetch()
  },
  todaysOrder () {
    var startTime = new Date()
    startTime.setHours(0,0,0)
    var endTime = new Date()
    endTime.setHours(23, 59, 59)
    const query = { status: { $ne: 'Cancelled' }, createdAt: { '$gte': startTime, '$lte': endTime } }
    return Orders.find(query).count()
  },
  monthOrder () {
    const date = new Date()
    var firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    const allOrders = Orders.find({}).count()
    const query = { status: { $ne: 'Cancelled' }, createdAt: { '$gte': firstDay, '$lte': lastDay } }
    return Orders.find(query).count()
  },
  monthIncome () {
    const date = new Date()
    var firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    //
    const query = { status: { $ne: 'Cancelled' }, createdAt: { '$gte': firstDay, '$lte': lastDay } }
    const orders = Orders.find(query).fetch()
    // const dealerTotal = _.reduce(_.pluck(orders, 'dealerTotal'), function(item, num) { return item + (num ? num : 0); }, 0)
    const orderPriceTotal = _.reduce(_.pluck(orders, 'totalPrice'), function(item, num) { return item + (num ? num : 0); }, 0)
    //
    // return ((orderPriceTotal - dealerTotal))
    return orderPriceTotal
  },
  deliveryLimit () {
    const setting = Settings.findOne({ _id: 'Free_Order_Delivery_Limit' })
    return setting ? setting.value : 0
  },
  deliveryCharge () {
    const setting = Settings.findOne({ _id: 'Delivery_Charge' })
    return setting ? setting.value : 0
  }
})

Template.dashboard.events({
  'click .edit-limit' (event, template) {
    event.preventDefault()
    $('#deliveryLimitBox').toggleClass('edit-mode')
    Meteor.defer(function () {
      $('#txtDeliveryLimit').focus()
    })
  },
  'click .edit-charge' (event, template) {
    event.preventDefault()
    $('#deliveryChargeBox').toggleClass('edit-mode')
    Meteor.defer(function () {
      $('#txtDeliveryCharge').focus()
    })
  },
  'submit #deliveryLimitForm' (event, template) {
    event.preventDefault()
    const value = $('#txtDeliveryLimit').val()
    if (value) {
      Meteor.call('setDeliveryLimit', Number(value), (error, result) => {
        if (error) return toastr.error(error.reason)
        else {
          $('#deliveryLimitBox').removeClass('edit-mode')
          return toastr.success('Free order delivery limit updated successfully')
        }
      })
    } else {
      console.log('Invalid value')
    }
  },
  'submit #deliveryChargeForm' (event, template) {
    event.preventDefault()
    const value = $('#txtDeliveryCharge').val()
    if (value) {
      Meteor.call('setDeliveryCharge', Number(value), (error, result) => {
        if (error) return toastr.error(error.reason)
        else {
          $('#deliveryChargeBox').removeClass('edit-mode')
          return toastr.success('Delivery charge updated successfully')
        }
      })
    } else {
      console.log('Invalid value')
    }
  }
})
