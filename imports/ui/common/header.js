import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'

import './header.html'
import './loading.html'

Template.header.events({
  'click #linkLogout' (event) {
    event.preventDefault()
    Meteor.logout()
  }
})

Template.header.helpers({
  'userName' () {
  	const user = Meteor.user()
  	if (user && user.profile && user.profile.name) return user.profile.name
  	else return
  }
})
