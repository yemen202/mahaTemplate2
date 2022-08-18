import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Roles } from 'meteor/alanning:roles'
import { Products } from '/imports/api/products/collection'
import { Categories } from '/imports/api/categories/collection'
import { Options } from '/imports/api/options/collection'
import { OptionValues } from '/imports/api/optionValues/collection'

import './index.html'

Template.productAddEdit.onCreated(function () {
  const self = this
  self.uploadedImageList = new ReactiveVar([])
  self.newImageList = new ReactiveVar([])
  self.newImageUrls = new ReactiveVar([])

  self.selectedOptions = new ReactiveVar([])
  self.activeOption = new ReactiveVar()
  self.selectedOptionValues = new ReactiveVar([])

  self.showCategoriesMenu = new ReactiveVar(false)
  self.categorySearch = new ReactiveVar()
  self.selectedCategories = new ReactiveVar([])

  self.showSimilarProductsMenu = new ReactiveVar(false)
  self.productSearch = new ReactiveVar()
  self.similarProducts = new ReactiveVar([])

  self.setOptionValues = function () {
    if(self.subsProducts.ready()) {
      const product = Products.findOne({_id: FlowRouter.getParam('productId')})
      if(!product) FlowRouter.go('/products')
      else {
        if(product.options && product.options.length > 0 && self.subsOptionValues.ready()) {
          const optionValues = OptionValues.find({ _id: { $in: _.pluck(product.options, 'optionValueId') }}).fetch()
          const selectedOptions = _.uniq(_.pluck(optionValues, 'optionId'))
          const selectedOptionValues = _.map(product.options, (option, index) => {
            const optionId = option.optionValueId ? _.find(optionValues, optionValue => optionValue._id == option.optionValueId)?.optionId : ''
            return { ...option, id: index + 1,  optionId }
          })
          if(selectedOptions && selectedOptions[0]) Template.instance().activeOption.set(selectedOptions[0])
          Template.instance().selectedOptions.set(selectedOptions)
          Template.instance().selectedOptionValues.set(selectedOptionValues)
        }
        if(product.categories && product.categories.length > 0 && self.subsCategories.ready()) {
          const categories = Categories.find({ _id: { $in: product.categories } }).fetch()
          _.each(categories, category => {
            if(category.parentId) Template.instance().getCategoryParentFn(category.parentId, category)
          })
          Template.instance().selectedCategories.set(categories)
        }
        if(product.similarProducts && product.similarProducts.length > 0) {
          const similarProducts = Products.find({ _id: { $in: product.similarProducts }}).fetch()
          if(similarProducts && similarProducts.length > 0) Template.instance().similarProducts.set(similarProducts)
        }
      }
    }
  }

  self.autorun(function () {
    FlowRouter.watchPathChange()
    const productId = FlowRouter.getParam('productId')
    self.subsOptionValues = self.subscribe('optionValues')
    self.subsProducts = self.subscribe('products')
    if(productId) {
      self.subsCategories = self.subscribe('categories')
      self.setOptionValues()
    }
    self.subscribe('categories')
    self.subscribe('options')
  })

  self.getCategoryParentFn = function (parentId, category) {
    const parentCategory = Categories.findOne({ _id: parentId })
    category.name = `${parentCategory.name} > ` + category.name
    if(parentCategory.parentId) self.getCategoryParentFn(parentCategory.parentId, category)
  }

  self.validateFn = function (formData) {
    if(!formData.name) {
      toastr.error('Please enter product name')
      return false
    } else if(!formData.price) {
      toastr.error('Please enter price')
      return false
    } else if(!formData.quantity) {
      toastr.error('Please enter quantity')
      return false
    } else if(formData.categories.length <= 0) {
      toastr.error('Please select category')
      return false
    }
    return true
  }

  self.addEditFn = function (formData) {
    const methodName = formData._id ? 'editProduct' : 'addProduct'
    Meteor.call(methodName, formData, (error, result) => {
      $("#btnSaveProduct").attr("disabled", false);
      if (error) toastr.error(error.reason)
      else {
        toastr.success(formData._id ? 'Product updated successfully' : 'Product added successfully')
        self.resetProductForm()
        FlowRouter.go('/products')
      }
    })
  }

  self.uploadImgFn = function (files, cb) {
    const uploadType = Meteor.settings && Meteor.settings.public && Meteor.settings.public.uploadType ? Meteor.settings.public.uploadType : 'fileSystem';
    var downUrl = []

    if(uploadType && uploadType == 'awsS3') {
      _.map(files, (file, index) => {
        var uploadInstance = new Slingshot.Upload('imageUploads')
        uploadInstance.send(file, function (error, downloadUrl) {
            if (!error) {
              downUrl.push(downloadUrl)
              if (downUrl.length === files.length) cb && cb(null, downUrl)
            } else {
              cb && cb(error, null)
            }
        })
      })
    } else {
      _.map(files, (file, index) => {
        var uploadInstance = ProductImg.insert({
          file: file,
          streams: 'dynamic',
          chunkSize: 'dynamic'
        }, false);

        uploadInstance.on('end', function(error, file) {
          if (!error) {
            if (file && file._downloadRoute && file._collectionName && file._id && file.extension) downUrl.push(`${Meteor.absoluteUrl() + file._downloadRoute.substring(1)}/${file._collectionName}/${file._id}/original/${file._id}.${file.extension}`)
            if (downUrl.length === files.length) cb && cb(null, downUrl)
          } else {
            cb && cb(error, null)
          }
        });
        uploadInstance.start()
      })
    }
  }

  self.resetProductForm = function () {
    $('#productForm').trigger("reset")
    self.uploadedImageList.set([])
    self.newImageList.set([])
    self.newImageUrls.set([])
  }
})

Template.productAddEdit.helpers({
  product () {
    var productId = FlowRouter.getParam('productId'), product = {}
    if(productId) product = Products.findOne({ _id: productId })
    //
    setTimeout(function () {
      $('#productDescription').summernote('code', product && product.description ? product.description : '')
    }, 250)
    //
    return product
  },
  title () {
    const productId = FlowRouter.getParam('productId')
    if(productId) return 'Edit Product'
    else return 'Add Product'
  },
  showCategoriesMenu () {
    return Template.instance().showCategoriesMenu.get()
  },
  categoryList () {
    const searchText = Template.instance().categorySearch.get()
    var categories = Categories.find().fetch()

    _.each(categories, category => {
      if(category.parentId) Template.instance().getCategoryParentFn(category.parentId, category)
    })

    if (searchText && searchText.trim()) {
      const r = new RegExp(searchText.trim(), 'i')
			categories = _.filter(categories, (category) => r.test(category.name))
    }

    return categories
  },
  showSimilarProductsMenu () {
    return Template.instance().showSimilarProductsMenu.get()
  },
  productList () {
    var query = {}, productId = FlowRouter.getParam('productId'), searchText = Template.instance().productSearch.get()
    if(productId) {
      const product = Products.findOne({ _id: productId })
      query['_id'] = { $ne: productId }
      if(product && product.categories) query['categories'] = { $in: product.categories }
    }
    if(searchText && searchText.trim()) {
      if(query.categories) delete query.categories
      query['name'] = { $regex: searchText.trim(), $options: 'i' }
    }
    return Products.find(query).fetch()
  },
  selectedCategories () {
    return Template.instance().selectedCategories.get()
  },
  similarProducts () {
    return Template.instance().similarProducts.get()
  },
  options () {
    return Options.find().fetch()
  },
  photos () {
    if (this && this.photos && this.photos.length) Template.instance().uploadedImageList.set(this.photos)
    return Template.instance().uploadedImageList.get()
  },
  newImages () {
    return Template.instance().newImageUrls.get()
  },
  selectedOptions () {
    const options = Options.find().fetch()
    const selectedOptions = Template.instance().selectedOptions.get()
    return _.filter(options, option => { return _.contains(selectedOptions, option._id) })
  },
  displayTable () {
    const selectedOptions = Template.instance().selectedOptions.get()
    const activeOption = Template.instance().activeOption.get()
    if(activeOption && selectedOptions && selectedOptions.length > 0) return true
    return false
  },
  isDisbledOption (optionId) {
    const selectedOptions = Template.instance().selectedOptions.get()
    const isSelected = _.find(selectedOptions, function(option){ return option == optionId })
    return isSelected ? true : false
  },
  isActiveOption (optionId) {
    const activeOption = Template.instance().activeOption.get()
    return activeOption && activeOption == optionId ? 'active' : ''
  },
  activeOptionValues () {
    const activeOption = Template.instance().activeOption.get()
    const selectedOptionValues = Template.instance().selectedOptionValues.get()
    if(activeOption && selectedOptionValues && selectedOptionValues.length > 0) return _.filter(selectedOptionValues, optionValue => { return optionValue.optionId == activeOption })
    return []
  },
  activeSelectOptionValues () {
    const activeOption = Template.instance().activeOption.get()
    if(activeOption) return OptionValues.find({ optionId: activeOption }).fetch()
    return []
  },
  isDisbledOptionValue () {
    const selectedOptionValues = Template.instance().selectedOptionValues.get()
    return this && this._id && _.find(selectedOptionValues, option => { return option.optionValueId == this._id })
  },
  isSelectedOptionValue (optionValueId) {
    return this && this._id && this._id == optionValueId
  },
  isSelectPricePrefix (pricePrefix) {
    return this && this.pricePrefix && this.pricePrefix == pricePrefix
  }
})

Template.productAddEdit.events({
  'focus #categorySearch' (event, instance) {
    instance.showCategoriesMenu.set(true)
  },
  'blur #categorySearch' (event, instance) {
    setTimeout(function () {
      instance.showCategoriesMenu.set(false)
    }, 150)
  },
  'input #categorySearch' (event, instance) {
    event.preventDefault()
    instance.categorySearch.set(event.target.value)
  },
  'click .category-menu .category-item' (event, instance) {
    if(this && this._id) {
      const selectedCategories = instance.selectedCategories.get()
      const isAlreadyAdded = selectedCategories.find(category => category._id == this._id)
      if(!isAlreadyAdded) {
        selectedCategories.push(this)
        instance.selectedCategories.set(selectedCategories)
      }
    }
  },
  'click .remove-category' (event, instance) {
    event.preventDefault()
    if(this && this._id) {
      const selectedCategories = _.filter(instance.selectedCategories.get(), category => category._id !== this._id)
      instance.selectedCategories.set(selectedCategories)
    }
  },
  'focus #productSearch' (event, instance) {
    instance.showSimilarProductsMenu.set(true)
  },
  'blur #productSearch' (event, instance) {
    setTimeout(function () {
      instance.showSimilarProductsMenu.set(false)
    }, 150)
  },
  'input #productSearch' (event, instance) {
    event.preventDefault()
    instance.productSearch.set(event.target.value)
  },
  'click .product-menu .product' (event, instance) {
    if(this && this._id) {
      const similarProducts = instance.similarProducts.get()
      const isAlreadyAdded = similarProducts.find(product => product._id == this._id)
      if(!isAlreadyAdded) {
        similarProducts.push(this)
        instance.similarProducts.set(similarProducts)
      }
    }
  },
  'click .remove-similar-product' (event, instance) {
    event.preventDefault()
    if(this && this._id) {
      const similarProducts = _.filter(instance.similarProducts.get(), product => product._id !== this._id)
      instance.similarProducts.set(similarProducts)
    }
  },
  'submit #productForm' (event, template) {
    event.preventDefault()
    const productId = FlowRouter.getParam('productId')
    const formDataArray = $('#productForm').serializeArray()
    const optionValues = template.selectedOptionValues.get()
    const selectedCategories = _.flatten(_.pluck(template.selectedCategories.get(), '_id'))

    const formData = {}, options = []
    formDataArray.forEach((field) => {
      formData[field.name] = field.value
    })
    formData['description'] = $('#productDescription').summernote('code')
    formData['categories'] = selectedCategories
    formData['similarProducts'] = _.pluck(template.similarProducts.get(), '_id')

    const isValid = template.validateFn(formData)
    if(isValid) {
      if(!formData.specialPrice) formData.specialPrice = formData.price
      if (parseInt(formData.specialPrice) > parseInt(formData.price)) return toastr.error('Price must be greater than the special price')
      if (productId) formData._id = productId
      if(optionValues && optionValues.length > 0) {
        for(i = 0; i < optionValues.length; i++) {
          if(optionValues[i].optionValueId) {
            if(!optionValues[i].price || (optionValues[i].price && parseInt(optionValues[i].price) < parseInt(formData.specialPrice))) {
              options.push({ optionValueId: optionValues[i].optionValueId, quantity: optionValues[i].quantity || 0, price: optionValues[i].price || 0, pricePrefix: optionValues[i].pricePrefix })
            } else {
              const opValue = OptionValues.findOne({ _id: optionValues[i].optionValueId })
              return toastr.error(`Price must be less than than the special price in Option value - ${opValue && opValue.value ? opValue.value : ``}`)
            }
          }
        }
      }
      formData.options = options
      formData['visible'] = formData.visible ? true : false
      formData['popular'] = $('#productPopular').is(':checked')

      var saveImageArray = template.newImageList.get()
      var uploadedImageArray = template.uploadedImageList.get()

      $("#btnSaveProduct").attr("disabled", true);
      if (saveImageArray.length > 0) {
        _.extend(formData, { photos: [] })
        template.uploadImgFn(saveImageArray, (error, result) => {
          if (error) {
            $("#btnSaveProduct").attr("disabled", false);
            if(error.error && error.error == 'Invalid directive') toastr.error('Please set awsS3 credentials for upload image using awsS3')
            else toastr.error(error.reason)
          } else {
            formData.photos = _.flatten([uploadedImageArray, result])
            template.addEditFn(formData)
          }
        })
      } else {
        formData.photos = uploadedImageArray
        template.addEditFn(formData)
      }
    }
  },
  'change #productImage'(event, instance) {
    event.preventDefault();
    const saveImages = instance.newImageList.get()
    const images = instance.newImageUrls.get()
    const file = document.getElementById('productImage').files[0]

    const reader = new FileReader()
    reader.onload = function(event) {
      if (_.indexOf(images, event.target.result) === -1) {
        images.push(event.target.result)
        instance.newImageUrls.set(images)
      }
    }
    saveImages.push(file)
    instance.newImageList.set(saveImages)
    reader.readAsDataURL(document.getElementById('productImage').files[0])
  },
  'click .remove-image' (event, instance) {
    const value = this.valueOf()
    const images = instance.uploadedImageList.get()
    const index = images.indexOf(value)


    images.splice(index, 1)
    instance.uploadedImageList.set(images)
  },
  'click .remove-new-image' (event, instance) {
    const value = this.valueOf()
    const saveImages = instance.newImageList.get()
    const urls = instance.newImageUrls.get()
    const index = urls.indexOf(value)

    urls.splice(index, 1)
    saveImages.splice(index, 1)
    instance.newImageUrls.set(urls)
    instance.newImageList.set(saveImages)
  },
  'click .btn-cancel' (event, instance) {
    event.preventDefault();
    FlowRouter.go('/products')
  },
  'change #optionSelect' (event, instance) {
    event.preventDefault()
    const selectedOptions = instance.selectedOptions.get()
    selectedOptions.push(event.target.value)
    instance.activeOption.set(event.target.value)
    instance.selectedOptions.set(selectedOptions)
    $("#optionSelect").val("");
  },
  'click .option-item' (event, instance) {
    event.preventDefault()
    const selectedOption = this.valueOf()
    if(selectedOption && selectedOption._id && event.target.tagName != 'I') instance.activeOption.set(selectedOption._id)
  },
  'click .btn-add' (event, instance) {
    event.preventDefault()
    const activeOption = instance.activeOption.get()
    const optionValues = instance.selectedOptionValues.get()
    if(activeOption) optionValues.push({ id: optionValues.length + 1, optionId: activeOption, optionValueId: '', quantity: '', pricePrefix: 'plus', price: '' })
    instance.selectedOptionValues.set(optionValues)
  },
  'change .value-id, change .value-quantity, change .value-price-prefix, change .value-price' (event, instance) {
    event.preventDefault()
    const option = this.valueOf()
    const optionValues = instance.selectedOptionValues.get()
    if(option && option.id) {
      const options = _.filter(optionValues, optionValue => {
        if(optionValue.id == option.id) optionValue[event.target.name] = event.target.value
        return optionValue
      })
      instance.selectedOptionValues.set(options)
    }
  },
  'click .btn-remove' (event, instance) {
    event.preventDefault()
    const option = this.valueOf()
    if(option && option.id) {
      const optionValues = _.filter(instance.selectedOptionValues.get(), optionValue => { return optionValue.id != option.id })
      instance.selectedOptionValues.set(optionValues)
    }
  },
  'click .remove-option' (event, instance) {
    event.preventDefault()
    if(this._id) {
      const selectedOptions = instance.selectedOptions.get()
      const optionValues = instance.selectedOptionValues.get()
      const activeOption = instance.activeOption.get()
      instance.selectedOptionValues.set(_.filter(optionValues, option => option.optionId != this._id))
      instance.selectedOptions.set(_.filter(selectedOptions, option => option != this._id))
      if(this._id == activeOption) instance.activeOption.set('')
    }
  }
})
