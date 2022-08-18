import { WebApp } from 'meteor/webapp'

const connectHandler = WebApp.connectHandlers // get meteor-core's connect-implementation

// attach connect-style middleware for response header injection
Meteor.startup(function () {
	connectHandler.use(function (req, res, next) {
		res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
		res.setHeader('X-Frame-Options', 'deny')
		return next()
	});
});
