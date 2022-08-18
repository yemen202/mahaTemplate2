import { Template } from 'meteor/templating'
import { Settings } from '/imports/api/settings/collection'

import './modals/add-edit-privacy.js'
import './index.html'

Template.privacy.onCreated(function () {
  const self = this
  self.isAdd = new ReactiveVar(true)
})

Template.privacy.events({
  'click #btnAddEditPrivacy' (event, template) {
    event.preventDefault()
    $('#privacyAddEditModal').modal('show')
  }
})

Template.privacy.helpers({
  privacyPolicy () {
    const setting = Settings.findOne({ _id: 'Privacy_Policy' })
    if(setting && setting.value) {
      Template.instance().isAdd.set(false)
      return new Handlebars.SafeString(setting.value);
    }
    return false
  },
  isAdd () {
    return Template.instance().isAdd.get()
  }
})
