import { Template } from 'meteor/templating'
import { Settings } from '/imports/api/settings/collection'

import './add-edit-privacy.html'

Template.privacyAddEditModal.helpers({
  privacyPolicy () {
    const setting = Settings.findOne({ _id: 'Privacy_Policy' })
    setTimeout(function () {
      $('#privacyPolicy').summernote('code', setting ? setting.value : '')
    }, 250)
  }
})

Template.privacyAddEditModal.events({
  'submit #privacyAddEditModal' (event, template) {
    event.preventDefault()
    const policy = $('#privacyPolicy').summernote('code')
    if (policy) {
      $('#privacyAddEditModal').addClass('process')
      Meteor.call('setPrivacyPolicy', policy, (error, result) => {
        if (error) return toastr.error(error.reason)
        else {
          toastr.success('Privacy policy updated successfully')
          $('#privacyAddEditModal').modal('hide')
        }
      })
      $('#privacyAddEditModal').removeClass('process')
    } else {
      return toastr.error('Please enter privacy policy')
    }
  }
})
