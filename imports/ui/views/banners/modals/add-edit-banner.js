import { Template } from 'meteor/templating'

import './add-edit-banner.html'

Template.bannerAddEditModal.onCreated(function () {
  const self = this
  this.uploadedImage = new ReactiveVar('');

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
      var uploadInstance = BannerImg.insert({
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

Template.bannerAddEditModal.helpers({
	uploadedImage () {
		const instance = this
		if (Template.instance().uploadedImage.get()) return Template.instance().uploadedImage.get()
		else return ''
	}
})

Template.bannerAddEditModal.events({
  'change #bannerImage' (event, instance) {
    event.preventDefault();

    const reader = new FileReader()
    reader.onload = function(event) {
      instance.uploadedImage.set(event.target.result)
    }
    reader.readAsDataURL(document.getElementById('bannerImage').files[0])
  },
  'submit #bannerForm' (event, template) {
    event.preventDefault()
    const formDataArray = $('#bannerForm').serializeArray()
    const formData = {}
    formDataArray.forEach((field) => {
      formData[field.name] = field.value
    })
    if (formData.visible) formData.visible = true
    const file = document.getElementById('bannerImage').files[0]
    if (file) {
      $('#bannerAddEditModal').addClass('process')

      const uploadType = Meteor.settings && Meteor.settings.public && Meteor.settings.public.uploadType ? Meteor.settings.public.uploadType : 'fileSystem';
      template.uploadImgFn(uploadType, file, (error, res) => {
        if (error) {
          $('#bannerAddEditModal').removeClass('process')
          if(uploadType && uploadType == 'awsS3' && error.error && error.error == 'Invalid directive') toastr.error('Please set awsS3 credentials for upload image using awsS3')
          else toastr.error(error.reason)
        } else {
          if(uploadType && uploadType == 'awsS3' && res) formData.photo = res
          else if(res && res._downloadRoute && res._collectionName && res._id && res.extension) formData.photo = `${Meteor.absoluteUrl() + res._downloadRoute.substring(1)}/${res._collectionName}/${res._id}/original/${res._id}.${res.extension}`
          Meteor.call('addBanner', formData, (error, result) => {
            $('#bannerAddEditModal').removeClass('process')
            if (error) toastr.error(error.reason)
            else {
              toastr.success('Banner added successfully')
              document.getElementById("bannerForm").reset()
              $('#bannerAddEditModal').modal('hide')
            }
          })
        }
      })
    } else return toastr.error("Image required")
  },
  'hidden.bs.modal #bannerAddEditModal' (event, instance) {
    instance.uploadedImage.set('')
    $('#bannerForm').trigger('reset')
  }
})
