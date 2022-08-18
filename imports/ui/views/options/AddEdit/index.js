import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Options } from '/imports/api/options/collection'
import { OptionValues } from '/imports/api/optionValues/collection'
import { Products } from '/imports/api/products/collection'

import './index.html'

Template.optionAddEdit.onCreated(function () {
  const self = this
  self.optionValues = new ReactiveVar([])

  self.autorun(function () {
    FlowRouter.watchPathChange()
    const optionId = FlowRouter.getParam('optionId')
    if(optionId) self.subsOptions = self.subscribe('option.byId', optionId, {})
  })
})

Template.optionAddEdit.helpers({
  isReady () {
    if(Template.instance().subsOptions) {
      const isSubReady = Template.instance().subsOptions.ready()
      if(isSubReady) {
        const optionId = FlowRouter.getParam('optionId')
        const option = Options.findOne({ _id: optionId })
        if(option && option._id) {
          const optionValues = OptionValues.find({ optionId }).fetch()
          if(optionValues && optionValues.length > 0) Template.instance().optionValues.set(optionValues)
        } else FlowRouter.go('/options')
      }
      return isSubReady
    }
    return true
  },
  title () {
    const optionId = FlowRouter.getParam('optionId')
    if(optionId) return 'Edit Option'
    else return 'Add Option'
  },
  option () {
    const optionId = FlowRouter.getParam('optionId')
    if(optionId) return Options.findOne({_id: FlowRouter.getParam('optionId')})
    return {}
  },
  optionValues () {
    return Template.instance().optionValues.get()
  },
  isSelected (value) {
    return this.type && value && this.type == value
  }
})

Template.optionAddEdit.events({
  'submit #optionForm' (event, template) {
    event.preventDefault()
    const optionValues = template.optionValues.get()
    if(optionValues && optionValues.length > 0 && optionValues[0].value && optionValues[0].value.trim()) {
      $("#btnSaveOption").attr('disabled', true)

      const formDataArray = $('#optionForm').serializeArray()
      const formData = { optionValues }
      formDataArray.forEach((field) => {
        formData[field.name] = field.value
      })
      const optionId = FlowRouter.getParam('optionId')
      let methodName = 'addOption'
      if(optionId) {
        methodName = 'editOption'
        formData['_id'] = optionId
      }

      Meteor.call(methodName, formData, (error, result) => {
        $("#btnSaveOption").attr('disabled', false)
        if (error) toastr.error(error.reason)
        else {
          toastr.success(optionId ? 'Option updated successfully' : 'Option added successfully')
          FlowRouter.go('/options')
        }
      })
    } else {
      return toastr.error('Option Values required!')
    }
  },
  'click .btn-add' (event, template) {
    event.preventDefault()
    const optionValues = template.optionValues.get()
    optionValues.push({ value: '' })
    template.optionValues.set(optionValues)
  },
  'click .btn-remove' (event, template) {
    event.preventDefault()
    const index = event.currentTarget.dataset.id
    const optionValues = template.optionValues.get()
    if(optionValues && optionValues[index]) {
      if(optionValues[index]._id) {
        const productCount = Products.find({ 'options.optionValueId': optionValues[index]._id }, { _id: 1 }).count()
        if(productCount > 0) {
          return toastr.error('This option value cannot be deleted as it is currently assigned to products!')
        } else {
          optionValues.splice(index, 1)
          template.optionValues.set(optionValues)
        }
      } else {
        optionValues.splice(index, 1)
        template.optionValues.set(optionValues)
      }
    }
  },
  'click .btn-cancel' (event, template) {
    event.preventDefault()
    FlowRouter.go('/options')
  },
  'change .option-value' (event, template) {
    const option = this
    option[event.target.name] = event.target.value
    const index = event.currentTarget.dataset.id
    const optionValues = template.optionValues.get()
    if(index && optionValues && optionValues[index]) {
      optionValues[index] = option
      template.optionValues.set(optionValues)
    }
  }
})
