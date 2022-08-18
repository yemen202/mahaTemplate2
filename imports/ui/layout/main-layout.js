import { Template } from 'meteor/templating'

import './main-layout.html'

Template.mainLayout.onRendered(function () {
  // close sidebar on outside click
  $('body').click(function(event) {
    if($(window).width() <= 991 && $('body').hasClass('sidebar-open')) {
      const elementId = $(event.target).attr('id')
      if(elementId !== 'sidebar' && elementId !== 'sidebarTitle') {
        $("body").removeClass("sidebar-open");
  			$("body .page-sidebar").removeClass("visible");
      }
    }
  })
})

Template.mainLayout.helpers({
  userId() {
    return Meteor.userId()
  },
  goToLoginPage() {
    FlowRouter.go('/login')
  }
})
