import { Template } from 'meteor/templating'
import { Orders } from '/imports/api/orders/collection'
import { Products } from '/imports/api/products/collection'

import './add-edit-order.html'

Template.orderAddEditModal.onCreated(function () {
  const self = this

  self.autorun(function () {
    self.subscribe('products')
  })
})

Template.orderAddEditModal.helpers({
  item () {
    const instance = Template.instance()
    const item = instance.data.item
    return _.extend({}, item)
  },
  getUser () {
    const user =  Meteor.users.findOne({_id: this.userId})
    if (user) return user.profile
  },
  getDeliveryAddress () {
    if(this.deliveryAddress && this.deliveryAddress.addressId) {
      var deliveryAddress = ''
      if(this.deliveryAddress.firstName) deliveryAddress += `${this.deliveryAddress.firstName}`
      if(this.deliveryAddress.lastName) deliveryAddress += ` ${this.deliveryAddress.lastName}`
      if(this.deliveryAddress.address) deliveryAddress += `\n ${this.deliveryAddress.address}`
      if(this.deliveryAddress.area) deliveryAddress += `, ${this.deliveryAddress.area}`
      if(this.deliveryAddress.city) deliveryAddress += `, ${this.deliveryAddress.city}`
      if(this.deliveryAddress.pincode) deliveryAddress += ` - ${this.deliveryAddress.pincode}`
      if(this.deliveryAddress.country) deliveryAddress += `, ${this.deliveryAddress.country}`
      if(this.deliveryAddress.mobile) deliveryAddress += `\n ${this.deliveryAddress.mobile}`
      return deliveryAddress
    }
    return ''
  },
  getProductName (id) {
    const product = Products.findOne({_id: id})
    return product ? product.name : (this.name ? this.name : '')
  },
  getDate (date) {
    return moment(date).format('DD MMM YYYY h:mm A');
  }
})

Template.orderAddEditModal.events({
  'click .btn-cancel'(event, instance) {
    event.preventDefault()
    $('#orderForm').trigger("reset")
  },
  'click .close'(event, instance) {
    event.preventDefault()
    $('#orderForm').trigger("reset")
  }
})
