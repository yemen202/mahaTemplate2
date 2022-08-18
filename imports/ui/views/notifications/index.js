import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { Notifications } from '/imports/api/notifications/collection'

import './modals/add-edit-notification.js'
import './index.html'

Template.notifications.onCreated(function () {
  const self = this
  self.selectedNotification = new ReactiveVar({})

  self.autorun(function () {
    self.subsNotifications = self.subscribe('notifications')
  })
})

Template.notifications.rendered = function() {
	$('#notificationsTable').footable()
}

Template.notifications.helpers({
  isReady () {
    return Template.instance().subsNotifications.ready()
  },
  notifications () {
    return Notifications.find().fetch()
  },
  selectedNotification () {
    const notification = Template.instance().selectedNotification.get()
    return notification ? notification : {}
  },
  getDate (date) {
    return moment(date).format("DD MMM YYYY h:mm A");
  }
})

Template.notifications.events({
  'click #btnAddNotification' (event, template) {
    event.preventDefault()
    $('#notificationAddEditModal').modal('show')
  },
  'click .btn-edit' (event, template) {
    event.preventDefault()
    template.selectedNotification.set(this)
    $('#notificationAddEditModal').modal('show')
  },
  'hidden.bs.modal #notificationAddEditModal' (event, template) {
    template.selectedNotification.set({})
  }
})
