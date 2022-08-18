import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
//

import './modals/add-edit-user.js'
import './index.html'

Template.users.onCreated(function () {
  const self = this
  self.selectedUser = new ReactiveVar({})
  self.autorun(function () {
    self.subUsers = self.subscribe('users')
    self.subscribe('roles')
  })
})

Template.users.rendered = function() {
	Blaze._globalHelpers.filterChange('userListTable')
}

Template.users.helpers({
  isReady () {
    return Template.instance().subUsers.ready()
  },
  users () {
    return Meteor.users.find().fetch()
  },
  selectedUser () {
    const user = Template.instance().selectedUser.get()
    return user ? user : {}
  },
  getDate (date) {
    return moment(date).format('DD MMM YYYY h:mm A');
  },
  canDelete () {
    const user = this;
    if (Roles.userIsInRole(user._id, 'customer')) return true
  },
  getEmail (emails) {
    if (emails && emails.length && emails[0].address) return emails[0].address
    else return
  }
})

Template.users.events({
  'click #btnAddUser' (event, template) {
    event.preventDefault()
    $('#userAddEditModal').modal('show')
  },
  'click .btn-edit' (event, template) {
    event.preventDefault()
    const user = this
    template.selectedUser.set(user)
    $('#userAddEditModal').modal('show')
  },
  'click .btn-remove' (event, template) {
    event.preventDefault()
    sweetAlert({
      title: 'Would you like to delete this user?',
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#de4436',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      closeOnConfirm: true,
      html: false
    }, (isConfirm) => {
      if (isConfirm) {
        Meteor.call('removeUser', this._id, (error, result) => {
          if (error && error != null) {
            return toastr.error(error.reason);
          } else {
            toastr.success("User deleted successfully");
            Meteor.defer(function() {
              $('.footable').trigger('footable_initialize');
            });
          }
        });
      }
    })
  },
  'hidden.bs.modal #userAddEditModal' (event, template) {
    template.selectedUser.set({})
    $('#userForm').trigger("reset");
  }
})
