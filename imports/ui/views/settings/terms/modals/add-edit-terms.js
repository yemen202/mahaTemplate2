import { Template } from 'meteor/templating'
import { Settings } from '/imports/api/settings/collection'

import './add-edit-terms.html'

Template.termsAddEditModal.helpers({
  terms () {
    const setting = Settings.findOne({ _id: 'Terms_Conditions' })
    setTimeout(function () {
      $('#terms').summernote('code', setting ? setting.value : '')
    }, 250)
  }
})

Template.termsAddEditModal.events({
  'submit #termsAddEditModal' (event, template) {
    event.preventDefault()
    const policy = $('#terms').summernote('code')
    if (policy) {
      $('#termsAddEditModal').addClass('process')
      Meteor.call('setTermsandConditions', policy, (error, result) => {
        if (error) return toastr.error(error.reason)
        else {
          toastr.success('Terms & conditions updated successfully')
          $('#termsAddEditModal').modal('hide')
        }
      })
      $('#termsAddEditModal').removeClass('process')
    } else {
      return toastr.error('Please enter terms & conditions')
    }
  }
})
