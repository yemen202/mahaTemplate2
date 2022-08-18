import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'

// User Account creation function.
Accounts.onCreateUser(function(options, user) {
  user.profile = options.profile

  return user
})
