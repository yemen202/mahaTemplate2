import { Meteor } from 'meteor/meteor'
import { Banners } from '/imports/api/banners/collection.js'

//
Meteor.methods({
  'addBanner' (data) {
    if (data && data.photo) {
        const bannerData = { visible: data.visible, photo: data.photo, createdAt: new Date() };
        return Banners.insert(bannerData);
    } else throw new Meteor.Error('error-invalid-banner', 'Invalid details');
  },
  'deleteBanner' (id) {
  	if (id) return Banners.remove({_id: id})
  	else throw new Meteor.Error(403, 'Invalid details')
  },
  'updateBannerVisible' (visible, id) {
    if (_.isBoolean(visible) && id) return Banners.update({_id: id}, {$set: {visible: visible}})
    else throw new Meteor.Error(403, 'Invalid details')
  }
})
