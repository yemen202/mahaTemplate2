import { Template } from 'meteor/templating'
import { Settings } from '/imports/api/settings/collection'

import './modals/add-edit-terms.js'
import './index.html'

Template.terms.onCreated(function () {
  const self = this
  self.isAdd = new ReactiveVar(true)
})

Template.terms.events({
  'click #btnAddEditTerms' (event, template) {
    event.preventDefault()
    $('#termsAddEditModal').modal('show')
  }
})

Template.terms.helpers({
  terms () {
    const setting = Settings.findOne({ _id: 'Terms_Conditions' })
    if(setting && setting.value) {
      Template.instance().isAdd.set(false)
      return new Handlebars.SafeString(setting.value);
    }
    return ''
  },
  isAdd () {
    return Template.instance().isAdd.get()
  }
})
