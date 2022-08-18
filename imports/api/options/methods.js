import { Meteor } from 'meteor/meteor'
import { Options } from './collection'
import { OptionValues } from '/imports/api/optionValues/collection'
import { Products } from '/imports/api/products/collection'

Meteor.methods({
  'addOption' (data) {
    if (data && data.name && data.type) {
      const optionId = Options.insert({ name: data.name, type: data.type })
      if(optionId && data.optionValues && data.optionValues.length > 0) {
        _.each(data.optionValues, (option) => {
          if(option && option.value && option.value.trim()) OptionValues.insert({ optionId, ...option })
        })
      }
      return optionId
    } else {
      throw new Meteor.Error(403, 'Invalid details')
    }
  },
  'editOption' (data) {
    if (data && data._id) {
      const option = Options.findOne({ _id: data._id })
      if (option) {
        const updateData = {}
        if (!_.isUndefined(data.name)) updateData['name'] = data.name
        if (!_.isUndefined(data.type)) updateData['type'] = data.type

        if(data.optionValues && data.optionValues.length > 0) {
          const optionValues = OptionValues.find({ optionId: data._id }).fetch()
          const removeValuesId = _.difference(_.pluck(optionValues, '_id'), _.pluck(data.optionValues, '_id'))

          if(removeValuesId && removeValuesId.length > 0) {
            const productCount = Products.find({ 'options.optionValueId': { $in: removeValuesId }}, { '_id': 1 }).count()
            if(productCount > 0) throw new Meteor.Error(403, 'Option cannot updated')
            OptionValues.remove({ _id: { $in: removeValuesId } })
          }
          _.each(data.optionValues, (option) => {
            if(option && option.value && option.value.trim()) {
              if(option._id) OptionValues.update({ _id: option._id }, { $set: { value: option.value }})
              else OptionValues.insert({ optionId: data._id, ...option })
            }
          })
        }

        return Options.update({ _id: data._id }, {
          $set: updateData
        })
      } else {
        throw new Meteor.Error(403, 'Invalid option')
      }
    } else {
      throw new Meteor.Error(403, 'Invalid details')
    }
  },
  'removeOption' (id) {
    if (id) {
      const option = Options.findOne({ _id: id })
      if (option) {
        const optionValueIds = _.pluck(OptionValues.find({ optionId: id }, { _id: 1 }).fetch(), '_id')
        if(optionValueIds && optionValueIds.length > 0) {
          const productCount = Products.find({ 'options.optionValueId': { $in: optionValueIds }}).count()
          if(productCount > 0) {
            throw new Meteor.Error(403, `This option cannot be deleted as it is currently assigned to ${productCount} products!`)
          } else {
            OptionValues.remove({ _id: { $in: optionValueIds }})
            return Options.remove({ _id: id })
          }
        } else {
          return Options.remove({ _id: id })
        }
      } else {
        throw new Meteor.Error(403, 'Invalid option')
      }
    } else {
      throw new Meteor.Error(403, 'Invalid details')
    }
  }
})
