import { Template } from 'meteor/templating'
import { Notifications } from '/imports/api/notifications/collection'

import './add-edit-notification.html'


Template.notificationAddEditModal.events({
  'keypress #notificationForm' (event, template) {
    if (event.keyCode && event.keyCode == 13) {
      event.preventDefault()
      return false
    }
  },
  'submit #notificationForm' (event, template) {
    event.preventDefault()
    const formDataArray = $('#notificationForm').serializeArray()
    const formData = {}
    formDataArray.forEach((field) => {
      formData[field.name] = field.value
    })
    //
    if (template.data && template.data.item && template.data.item._id) formData._id = template.data.item._id
    $("#btnSaveNotification").attr('disabled', true)
    //
    const methodName = formData._id ? 'editNotification' : 'addNotification'
    Meteor.call(methodName, formData, (error, result) => {
      $("#btnSaveNotification").attr('disabled', false)
      if (error) toastr.error(error.reason)
      else {
        if (formData._id) toastr.success('Notification updated successfully')
        else toastr.success('Notification added successfully')
        $('#notificationForm').trigger("reset");
        $('#notificationAddEditModal').modal('hide')
      }
    })
  },
  'click .btn-cancel'(event, instance) {
    event.preventDefault();
    $('#notificationForm').trigger("reset");
  }
})
