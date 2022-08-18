import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { Banners } from '/imports/api/banners/collection'

import './modals/add-edit-banner.js'
import './index.html'

Template.banners.onCreated(function () {
  const self = this

  self.autorun(function () {
    self.subBanners = self.subscribe('banners')
  })
})

Template.banners.rendered = function() {
	Blaze._globalHelpers.filterChange('bannerListTable')
}

Template.banners.helpers({
  isReady () {
    return Template.instance().subBanners.ready()
  },
  banners () {
    return Banners.find().fetch()
  },
  getDate (date) {
    return moment(date).format('DD MMM YYYY h:mm A');
  }
})

Template.banners.events({
  'click #btnAddBanner' (event, template) {
    event.preventDefault()
    $('#bannerAddEditModal').modal('show')
  },
  'click .btn-remove' (event, instance) {
      event.preventDefault();
      sweetAlert({
          title: 'Would you like to delete this banner?',
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#de4436',
          confirmButtonText: 'Yes',
          cancelButtonText: 'Cancel',
          closeOnConfirm: true,
          html: false
      }, (isConfirm) => {
          if (isConfirm) {
              Meteor.call('deleteBanner', this._id, (error, result) => {
                  if (error && error != null) {
                      return toastr.error(error.reason);
                  } else {
                      toastr.success("Banner deleted successfully");
                      Meteor.defer(function() {
                          $('.footable').trigger('footable_initialize');
                      });
                  }
              });
          }
      })
  },
  'change #checkVisible' (event, instance) {
      event.preventDefault();
      var visible =  event.target.checked
      Meteor.call('updateBannerVisible', visible, this._id, (error, result) => {
          if (error && error != null) return toastr.error(error.reason);
          else {
              toastr.success("Banner updated successfully");
              Meteor.defer(function() {
                  $('.footable').trigger('footable_initialize');
              });
          }
      });
  }
})
