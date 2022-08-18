import { Meteor } from 'meteor/meteor'
import { Roles } from 'meteor/alanning:roles'
import { Core } from '/imports/api/lib/core.js'
import { Orders } from '/imports/api/orders/collection'

Meteor.methods({
  'addUser' (data) {
    if (data && data.email) {
      const isEmailExists = Meteor.users.findOne({ 'emails.address': data.email })
      if (isEmailExists) throw new Meteor.Error(403, 'Email already exists')
      //
      const role = data.role || 'customer'
      const userData = {
        email: (data.email).toLowerCase(),
        profile: {
          name: data.name,
          mobile: data.mobile || ''
        },
        role
      }
      const userId = Accounts.createUser(userData)

      Roles.addUsersToRoles(userId, [role])
      return userId
    } else {
      throw new Meteor.Error(403, 'Invalid details')
    }
  },
  'editUser' (data) {
    if (data && data._id) {
      const user = Meteor.users.findOne({ _id: data._id })
      if (user) {
        const isEmailExists = Meteor.users.findOne({ _id: { $ne: user._id }, 'emails.address': data.email })
        if (isEmailExists) throw new Meteor.Error(403, 'Email already exists')
        //
        const updateData = {
          'profile.name': data.name,
          'emails.0.address': data.email
        }
        if (!_.isUndefined(data.mobile)) updateData['profile.mobile'] = data.mobile
        //
        const userUpdated = Meteor.users.update({ _id: user._id }, {
          $set: updateData
        })
        return userUpdated
      } else {
        throw new Meteor.Error(403, 'Invalid user')
      }
    } else {
      throw new Meteor.Error(403, 'Invalid details')
    }
  },
  'removeUser' (id) {
    const user = Meteor.users.findOne({_id: id})
    if (user && Roles.userIsInRole(user, 'customer')) {
      const ordersCount = Orders.find({userId: user._id}).count()
      if (ordersCount) {
        throw new Meteor.Error(403, 'Customer having order already, It can not be delete')
      } else {
        return Meteor.users.remove({ _id: id })
      }
    } else {
      throw new Meteor.Error(403, 'Invalid user')
    }
  }
})
