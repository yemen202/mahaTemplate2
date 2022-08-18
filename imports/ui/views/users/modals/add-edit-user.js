import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { Roles } from 'meteor/alanning:roles'

import './add-edit-user.html'

Template.userAddEditModal.helpers({
  getEmail (emails) {
    if (emails && emails.length && emails[0].address) return emails[0].address
    else return
  },
  roleOptions () {
    return Meteor.roles.find({}).fetch()
  },
  isUserRole (role) {
    const user = Template.instance().data.item
    return Roles.userIsInRole(user, [role])
  }
})

Template.userAddEditModal.events({
  'submit #userForm' (event, template) {
    event.preventDefault()
    const formDataArray = $('#userForm').serializeArray()
    const formData = {}
    formDataArray.forEach((field) => {
      formData[field.name] = field.value
    })
    //
    if(formData && formData.mobile && !formData.mobile.match(/^\d{10}$/)) return toastr.error('Please enter valid phone number')
    if (template.data && template.data.item && template.data.item._id) formData._id = template.data.item._id
    $("#btnSaveUser").attr('disabled', true)
    //
    const methodName = formData._id ? 'editUser' : 'addUser'
    Meteor.call(methodName, formData, (error, result) => {
      $("#btnSaveUser").attr('disabled', false)
      if (error) toastr.error(error.reason)
      else {
        if (formData._id) toastr.success('User updated successfully')
        else toastr.success('User added successfully')
        $('#userAddEditModal').modal('hide')
      }
    })
  }
})
