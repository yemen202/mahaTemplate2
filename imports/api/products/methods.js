import { Meteor } from 'meteor/meteor'
import { Products } from './collection'
import { Carts } from '/imports/api/carts/collection'

Meteor.methods({
  'addProduct' (data) {
    if (data && data.name) {
      return Products.insert(data)
    } else {
      throw new Meteor.Error(403, 'Invalid details')
    }
  },
  'editProduct' (data) {
    if (data && data._id) {
      const product = Products.findOne({ _id: data._id })
      if (product) {
        const updateData = {}
        if (!_.isUndefined(data.name)) updateData['name'] = data.name
        if (!_.isUndefined(data.categories)) updateData['categories'] = data.categories
        if (!_.isUndefined(data.similarProducts)) updateData['similarProducts'] = data.similarProducts
        if (!_.isUndefined(data.description)) updateData['description'] = data.description
        if (!_.isUndefined(data.shortDescription)) updateData['shortDescription'] = data.shortDescription
        if (!_.isUndefined(data.price)) updateData['price'] = data.price
        if (!_.isUndefined(data.specialPrice)) updateData['specialPrice'] = data.specialPrice
        if (!_.isUndefined(data.quantity)) updateData['quantity'] = data.quantity
        if (!_.isUndefined(data.unit)) updateData['unit'] = data.unit
        if (!_.isUndefined(data.popular)) updateData['popular'] = data.popular
        if (!_.isUndefined(data.photos)) updateData['photos'] = data.photos
        if (!_.isUndefined(data.visible) && _.isBoolean(data.visible)) {
          updateData.visible = data.visible
          if(data.visible == false) Carts.update({'products.productId': data._id}, { $pull: { products: { productId: data._id } } }, { multi: true })
        }
        if(data.options && Array.isArray(data.options)) {
          if(product.options && product.options.length > 0) {
            const removedOptions = _.difference(_.pluck(product.options, 'optionValueId'), _.pluck(data.options, 'optionValueId'))
            if(removedOptions && removedOptions.length > 0) Carts.update({'products.productId': data._id}, { $pull: { products: { optionValueIds: { $in: removedOptions } } } }, { multi: true })
          }
          updateData['options'] = data.options
        }

        return Products.update({ _id: data._id }, {
          $set: updateData
        })
      } else {
        throw new Meteor.Error(403, 'Invalid product')
      }
    } else {
      throw new Meteor.Error(403, 'Invalid details')
    }
  },
  'removeProduct' (id) {
    if (id) {
      const product = Products.findOne({ _id: id })
      if (product) {
        Carts.update({'products.productId': id}, { $pull: { products: { productId: id } } }, { multi: true })
        return Products.remove({ _id: id })
      } else {
        throw new Meteor.Error(403, 'Invalid product')
      }
    } else {
      throw new Meteor.Error(403, 'Invalid details')
    }
  }
})
