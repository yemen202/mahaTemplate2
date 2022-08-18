import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { Options } from '/imports/api/options/collection'

import './index.html'

Template.options.onCreated(function () {
  const self = this
  self.autorun(function () {
    self.subsOptions = self.subscribe('options')
  })
})

Template.options.rendered = function() {
	Blaze._globalHelpers.filterChange('optionListTable')
}

Template.options.helpers({
  isReady () {
    return Template.instance().subsOptions.ready()
  },
  options () {
    return Options.find({}).fetch()
  },
  getDate (date) {
    return moment(date).format('DD MMM YYYY h:mm A')
  }
})

Template.options.events({
  'click #btnAddOption' (event, template) {
    event.preventDefault()
    FlowRouter.go('/option');
  },
  'click .btn-edit' (event, template) {
    event.preventDefault()
    FlowRouter.go(`/option/${this._id}`);
  },
  'click .btn-remove' (event, template) {
    event.preventDefault()
    sweetAlert({
      title: 'Would you like to delete this option?',
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#de4436',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      closeOnConfirm: true,
      html: false
    }, (isConfirm) => {
      if (isConfirm) {
        Meteor.call('removeOption', this._id, (error, result) => {
          if (error && error != null) {
            return toastr.error(error.reason);
          } else {
            toastr.success("Option deleted successfully");
            Meteor.defer(function() {
              $('.footable').trigger('footable_initialize');
            });
          }
        });
      }
    })
  },
})
