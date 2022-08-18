import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { Products } from '/imports/api/products/collection'
import { Categories } from '/imports/api/categories/collection'

import './index.html'

Template.products.onCreated(function () {
  const self = this
  this.selectedCategoryId = new ReactiveVar()

  self.autorun(function () {
    self.subsProducts = self.subscribe('products')
    self.subscribe('categories')
  })
})

Template.products.rendered = function() {
	Blaze._globalHelpers.filterChange('productListTable')
}

Template.products.helpers({
  isReady () {
    return Template.instance().subsProducts.ready()
  },
  products () {
    const query = {}, categoryId = Template.instance().selectedCategoryId.get()
    if(categoryId) query['categories'] = categoryId
    return Products.find(query).fetch()
  },
  getDate (date) {
    return moment(date).format('DD MMM YYYY h:mm A');
  },
  thumbImage (photos) {
    if (photos && photos.length) return photos[0]
    return ''
  },
  categoryList () {
    return Categories.find().fetch()
  }
})

Template.products.events({
  'click #btnAddProduct' (event, template) {
    event.preventDefault()
    FlowRouter.go('/product');
  },
  'click .btn-edit' (event, template) {
    event.preventDefault()
    const product = this
    FlowRouter.go(`/product/${product._id}`);
  },
  'change #filterCategory' (event, template) {
    if($('#productListTableEmptyMsg').length) $('#productListTableEmptyMsg').remove()
    template.selectedCategoryId.set(event.target.value)
  },
  'change #checkVisible' (event, instance) {
      event.preventDefault();
      Meteor.call('editProduct', { _id: this._id, visible: event.target.checked } , (error, result) => {
          if (error && error != null) return toastr.error(error.reason);
          else {
              toastr.success("Product updated successfully");
              Meteor.defer(function() {
                  $('.footable').trigger('footable_initialize');
              });
          }
      });
  },
  'click .btn-remove' (event, template) {
    event.preventDefault()
    sweetAlert({
      title: 'Would you like to delete this product?',
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#de4436',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      closeOnConfirm: true,
      html: false
    }, (isConfirm) => {
      if (isConfirm) {
        Meteor.call('removeProduct', this._id, (error, result) => {
          if (error && error != null) {
            return toastr.error(error.reason);
          } else {
            toastr.success("Product deleted successfully");
            Meteor.defer(function() {
              $('.footable').trigger('footable_initialize');
            });
          }
        });
      }
    })
  },
})
