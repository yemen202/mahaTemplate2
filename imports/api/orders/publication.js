import { Meteor } from 'meteor/meteor'
import { Roles } from 'meteor/alanning:roles'
import { Orders } from './collection'
import { Addresses } from '/imports/api/addresses/collection'

Meteor.publishComposite('orders', function(filters, options) {
  if (!this.userId) {
    return this.ready()
  }

  return {
    find: function() {
      const userId = this.userId
      if (!filters) filters = {}
      if (!options) options = {}

      if (filters.search) {
        const userQuery = { $or: [{ 'profile.name': { $regex: filters.search, $options: "i" } }, { 'emails.address': filters.search }] }
        const userIds = _.pluck(Meteor.users.find(userQuery).fetch(), '_id')
        filters['userId'] = { $in: userIds }
        delete filters['search']
      }

      return Orders.find(filters, options)
    },
    children: [{
      find: function(order) {
        return Meteor.users.find({ '_id': order.userId },{
          fields: {
             profile: 1,
             emails: 1
          }
        })
      }
    },
    {
      find: function (order) {
        if(order && order.deliveryAddress && order.deliveryAddress.addressId) return Addresses.find({ _id: order.deliveryAddress.addressId })
      }
    }]
  }
})

Meteor.publishComposite('ordersForCount', function(filters, options) {
  return {
    find: function() {
      const userId = this.userId
      if (Roles.userIsInRole(userId, 'admin')) {
        options = { fields: { totalPrice: 1, createdAt: 1 } }
        //
        const date = filters && filters.date ? filters.date : new Date()
        var firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
        var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)

        const query = { createdAt: { '$gte': firstDay, '$lte': lastDay } }
        return Orders.find(query, options)
      } else {
        return this.ready()
      }
    }
  }
})
