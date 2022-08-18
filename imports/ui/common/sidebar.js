import { Template } from 'meteor/templating'

import './sidebar.html'

Template.sidebar.onRendered(function () {
	/* Closes and Hides Sidebar before Route Change */
	if (Meteor.isClient) {
		// Set for all route changes
		FlowRouter.triggers.exit([function () {
			$("body").removeClass("sidebar-open");
			$("body .page-sidebar").removeClass("visible");
		}]);
	}
})
