import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { Categories } from '/imports/api/categories/collection'

import './modals/add-edit-category.js'
import './index.html'

Template.categories.onCreated(function () {
  const self = this
  self.selectedCategory = new ReactiveVar({})

  self.autorun(function () {
    self.subsCategories = self.subscribe('categories')
  })
})

Template.categories.rendered = function() {
	Blaze._globalHelpers.filterChange('categoryListTable')
}

Template.categories.helpers({
  isReady () {
    return Template.instance().subsCategories.ready()
  },
  categories () {
    return Categories.find().fetch()
  },
  selectedCategory () {
    const category = Template.instance().selectedCategory.get()
    return category ? category : {}
  },
  getDate (date) {
    return moment(date).format('DD MMM YYYY h:mm A');
  }
})

Template.categories.events({
  'click #btnAddCategory' (event, template) {
    event.preventDefault()
    $('#categoryAddEditModal').modal('show')
  },
  'click .btn-edit' (event, template) {
    event.preventDefault()
    const category = this
    template.selectedCategory.set(category)
    $('#categoryAddEditModal').modal('show')
  },
  'hidden.bs.modal #categoryAddEditModal' (event, template) {
    template.selectedCategory.set({})
    $('#categoryForm').trigger("reset")
  },
  'click .btn-remove' (event, template) {
    event.preventDefault()
    sweetAlert({
      title: 'Would you like to delete this category?',
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#de4436',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      closeOnConfirm: true,
      html: false
    }, (isConfirm) => {
      if (isConfirm) {
        Meteor.call('removeCategory', this._id, (error, result) => {
          if (error && error != null) {
            return toastr.error(error.reason);
          } else {
            toastr.success("Category deleted successfully");
            Meteor.defer(function() {
              $('.footable').trigger('footable_initialize');
            });
          }
        });
      }
    })
  },
})
