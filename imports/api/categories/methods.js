import { Meteor } from 'meteor/meteor'
import { Promise } from 'meteor/promise';
import { Categories } from '/imports/api/categories/collection'
import { Products } from '/imports/api/products/collection'

Meteor.methods({
  'addCategory' (data) {
    if (data && data.name) {
      const categoryData = {
	      name: data.name,
        photo: data.photo
      }
      if(data.parentId) categoryData.parentId = data.parentId
      return Categories.insert(categoryData)
    } else {
      throw new Meteor.Error(403, 'Invalid details')
    }
  },
  'editCategory' (data) {
    if (data && data._id) {
      const category = Categories.findOne({ _id: data._id })
      if (category) {
        const updateData = { name: data.name }
        if (data.photo) updateData.photo = data.photo
        if (!_.isUndefined(data.parentId)) updateData.parentId = data.parentId

        return Categories.update({ _id: category._id }, {
          $set: updateData
        })
      } else {
        throw new Meteor.Error(403, 'Invalid category')
      }
    } else {
      throw new Meteor.Error(403, 'Invalid details')
    }
  },
  'removeCategory' (id) {
    if (id) {
      const category = Categories.findOne({ _id: id })
      if (category) {
        const categories = Promise.await(
          Categories.aggregate([
            { $graphLookup: { from: 'categories', startWith: '$_id', connectFromField: '_id', connectToField: 'parentId', as: 'subCategories' } },
            { $match: { _id: id } },
            { $project: { subCategories: { _id: 1, name: 1 } } }
          ]).toArray()
        )
        var categoryList = [category._id]
        if(categories && categories[0] && categories[0].subCategories && categories[0].subCategories.length > 0) categoryList.push(..._.pluck(_.flatten(categories[0].subCategories), '_id'))

        var productsCount = Products.find({ categories: { $in: categoryList } }, { _id: 1 }).count()
        if (productsCount > 0) {
          throw new Meteor.Error(403, 'This category has products, It can not be delete')
        } else {
          return Categories.remove({ _id: { $in: categoryList } })
        }
      } else {
        throw new Meteor.Error(403, 'Invalid category')
      }
    } else {
      throw new Meteor.Error(403, 'Invalid details')
    }
  }
})
