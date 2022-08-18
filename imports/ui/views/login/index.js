import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Roles } from 'meteor/alanning:roles'

import './index.html'

Template.login.events({
  'submit #form-login' (event, template) {
    event.preventDefault()
    const username = $('input[name="username"]').val();
    const password = $('input[name="password"]').val();

    Meteor.loginWithPassword(username, password, (error, result) => {
      if (error) {
        return toastr.error(error.reason)
      } else {
        if (Roles.userIsInRole(Meteor.userId(), ['admin'])) {
          FlowRouter.go('/dashboard')
          document.location.reload(true);
        } else {
          Meteor.logout()
          return toastr.error('Invalid user')
        }
      }
    })
  }
});
