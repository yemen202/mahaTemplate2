import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { Roles } from 'meteor/alanning:roles'

Meteor.startup(() => {
  //
  Roles.createRole('admin', { unlessExists: true })
  Roles.createRole('customer', { unlessExists: true })
  //
  if (Roles.getUsersInRole('admin').count() == 0) {
    const userId = Accounts.createUser({
      username: 'admin',
      email: 'admin@admin.com',
      password: 'admin123',
      profile: { name: 'Admin' }
    })
    Roles.addUsersToRoles(userId, ['admin'])
  }
})
