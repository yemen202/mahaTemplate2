import { Template } from 'meteor/templating'
import { Categories } from '/imports/api/categories/collection'

import './add-edit-category.html'

Template.categoryAddEditModal.onCreated(function () {
  const self = this

  self.showCategoriesMenu = new ReactiveVar(false)
  self.categorySearch = new ReactiveVar()
  self.parentCategory = new ReactiveVar()

  this.uploadedImage = new ReactiveVar('');

  self.autorun(function () {
    const category = Template.currentData().item
    if(category && category.parentId) {
      if(category.parentName) category.parentName = ''
      Template.instance().getCategoryParentFn(category.parentId, category)
      Template.instance().parentCategory.set(category.parentId)
      if(category.parentName && category.parentName.includes('>')) {
        $('#categorySearchBox').val(category.parentName.slice(0, category.parentName.lastIndexOf('>') - 1))
        Template.instance().categorySearch.set(category.parentName.slice(0, category.parentName.lastIndexOf('>') - 1))
      }
    }
  })

  self.getCategoryParentFn = function (parentId, category) {
    const parentCategory = Categories.findOne({ _id: parentId })
    if(!category.parentName) category.parentName = category.name
    category.parentName = `${parentCategory.name ? `${parentCategory.name} > ` : ''}` + category.parentName
    if(parentCategory.parentId) self.getCategoryParentFn(parentCategory.parentId, category)
  }

  self.addEditFn = function (formData) {
    $('#categoryAddEditModal').addClass('process')
    const methodName = formData._id ? 'editCategory' : 'addCategory'
    //
    Meteor.call(methodName, formData, (error, result) => {
      $('#categoryAddEditModal').removeClass('process')
      if (error) toastr.error(error.reason)
      else {
        toastr.success(formData._id ? 'Category updated successfully' : 'Category added successfully')
        self.uploadedImage.set('')
        document.getElementById("categoryForm").reset()
        $('#categoryAddEditModal').modal('hide')
      }
    })
  }
  self.uploadImgFn = function (uploadType, file, cb) {
    if(uploadType && uploadType == 'awsS3') {
      var uploadInstance = new Slingshot.Upload('imageUploads')
      uploadInstance.send(file, function (error, downloadUrl) {
          if (!error) {
            cb && cb(null, downloadUrl)
          } else {
            cb && cb(error, null)
          }
      })
    } else {
      var uploadInstance = CategoryImg.insert({
        file: file,
        streams: 'dynamic',
        chunkSize: 'dynamic'
      }, false);

      uploadInstance.on('end', function(error, fileObj) {
        if (!error) {
          cb && cb(null, fileObj)
        } else {
          cb && cb(error, null)
        }
      });
      uploadInstance.start()
    }
  }
})

Template.categoryAddEditModal.helpers({
  showCategoriesMenu () {
    return Template.instance().showCategoriesMenu.get()
  },
  photoImg () {
    if (Template.instance().uploadedImage.get()) {
      return Template.instance().uploadedImage.get();
    } else if (this && this.photo) {
      Template.instance().uploadedImage.set(this.photo)
      return this.photo
    }
    return false
  },
  categories () {
    const currentCategory = Template.instance().data.item
    const parentCategory = Template.instance().parentCategory.get()
    const query = {}
    if(currentCategory && currentCategory._id) query['_id'] = { $ne: currentCategory._id }
    const searchText = Template.instance().categorySearch.get()

    var categories = Categories.find(query).fetch()
    _.each(categories, category => {
      if(category.parentId) Template.instance().getCategoryParentFn(category.parentId, category)
      else category.parentName = category.name
    })

    if (searchText && searchText.trim()) {
      const r = new RegExp(searchText.trim(), 'i')
            categories = _.filter(categories, (category) => r.test(category.parentName))
    }
    categories.unshift({ parentName: '--- None ---' })
    return categories
  }
})

Template.categoryAddEditModal.events({
  'focus #categorySearchBox' (event, instance) {
    instance.showCategoriesMenu.set(true)
  },
  'blur #categorySearchBox' (event, instance) {
    setTimeout(function () {
      instance.showCategoriesMenu.set(false)
    }, 150)
  },
  'input #categorySearchBox' (event, instance) {
    event.preventDefault()
    instance.categorySearch.set(event.target.value)
  },
  'click .category-menu .category-item' (event, instance) {
    if(this && this._id) instance.parentCategory.set(this._id)
    else instance.parentCategory.set('')
    instance.categorySearch.set(this.parentName)
    $('#categorySearchBox').val(this.parentName)
  },
  'submit #categoryForm' (event, template) {
    event.preventDefault()
    const formDataArray = $('#categoryForm').serializeArray()
    const formData = {}
    formDataArray.forEach((field) => {
      formData[field.name] = field.value
    })
    if (template.data && template.data.item && template.data.item._id) formData._id = template.data.item._id
    formData.parentId = template.parentCategory.get()
    //
    const file = document.getElementById('categoryImage').files[0]
    if (file) {
      $('#categoryAddEditModal').addClass('process')

      const uploadType = Meteor.settings && Meteor.settings.public && Meteor.settings.public.uploadType ? Meteor.settings.public.uploadType : 'fileSystem';
      template.uploadImgFn(uploadType, file, (error, res) => {
        if (error) {
          $('#categoryAddEditModal').removeClass('process')
          if(uploadType && uploadType == 'awsS3' && error.error && error.error == 'Invalid directive') toastr.error('Please set awsS3 credentials for upload image using awsS3')
          else toastr.error(error.reason)
        } else {
          if(res && uploadType && uploadType == 'awsS3') formData.photo = res
          else if(res && res._downloadRoute && res._collectionName && res._id && res.extension) formData.photo = `${Meteor.absoluteUrl() + res._downloadRoute.substring(1)}/${res._collectionName}/${res._id}/original/${res._id}.${res.extension}`
          template.addEditFn(formData)
        }
      })

    } else if (template.uploadedImage.get()) {
      template.addEditFn(formData)
    } else {
      return toastr.error("Image required")
    }
  },
  'change #categoryImage'(event, instance) {
    event.preventDefault();

    const reader = new FileReader()
    reader.onload = function(event) {
      instance.uploadedImage.set(event.target.result)
    }
    reader.readAsDataURL(document.getElementById('categoryImage').files[0])
  },
  'show.bs.modal #categoryAddEditModal' (event, instance) {
    instance.uploadedImage.set('')
    instance.categorySearch.set('')
    instance.parentCategory.set('')
  }
})
