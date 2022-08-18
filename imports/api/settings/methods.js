import { Meteor } from 'meteor/meteor'
import { Settings } from './collection'

Meteor.methods({
  'setDeliveryLimit' (value) {
    if (!_.isUndefined(value)) {
      return Settings.upsert({_id: 'Free_Order_Delivery_Limit'}, {
        $set: { value: value }
      })
    } else {
      throw new Meteor.Error(403, 'Invalid detail')
    }
  },
  'setDeliveryCharge' (value) {
    if (!_.isUndefined(value)) {
      return Settings.upsert({_id: 'Delivery_Charge'}, {
        $set: { value: value }
      })
    } else {
      throw new Meteor.Error(403, 'Invalid detail')
    }
  },
  'setPrivacyPolicy' (value) {
    if (!_.isUndefined(value)) {
      return Settings.upsert({_id: 'Privacy_Policy'}, {
        $set: { value: value }
      })
    } else {
      throw new Meteor.Error(403, 'Invalid detail')
    }
  },
  'setTermsandConditions' (value) {
    if (!_.isUndefined(value)) {
      return Settings.upsert({_id: 'Terms_Conditions'}, {
        $set: { value: value }
      })
    } else {
      throw new Meteor.Error(403, 'Invalid detail')
    }
  },
})
