const accessKey = Meteor.settings.aws && Meteor.settings.aws.accessKeyId ? Meteor.settings.aws.accessKeyId : ''
const secretKey = Meteor.settings.aws && Meteor.settings.aws.secretAccessKey ? Meteor.settings.aws.secretAccessKey : ''
const region = Meteor.settings.awsS3 && Meteor.settings.awsS3.region ? Meteor.settings.awsS3.region : ''
const bucket = Meteor.settings.awsS3 && Meteor.settings.awsS3.bucket ? Meteor.settings.awsS3.bucket : ''

if(accessKey && secretKey && region && bucket) {
	Slingshot.createDirective('imageUploads', Slingshot.S3Storage, {
		bucket: bucket,
		acl: 'public-read', // private
		region: region,
		AWSAccessKeyId: accessKey,
		AWSSecretAccessKey: secretKey,
		allowedFileTypes: /.*/i,
		maxSize: 2 * 1024 * 1024,
		authorize: function () {
			// Deny uploads if user is not logged in.
			if (!this.userId) {
				var message = 'Please login before posting files'
				throw new Meteor.Error('Login Required', message)
			}
			return true
		},

		key: function (file, metaContext) {
			const userId = this.userId
			const date = new Date()
			const filename = 'IMG_' + (date.getTime()) + '.' + getFileExFn(file.name);
			return 'images/' + userId + '/' + (filename)
		}
	})

	function getFileExFn(filename) {
		return filename.split('.').pop()
	}

	WebApp.rawConnectHandlers.use('https://'+ bucket +'.s3-eu-west-3.amazonaws.com/', function(req, res, next) {
		res.setHeader('Access-Control-Allow-Origin', '*')
	})
}
