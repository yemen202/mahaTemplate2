import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.subscriptions = function() {
  this.register('settings', Meteor.subscribe('settings'));
};


FlowRouter.route('/', {
  action: function(params) {
    if (Meteor.userId()) {
      FlowRouter.go('/dashboard');
    } else {
      FlowRouter.go('/login');
    }
  }
});

FlowRouter.route('/login', {
  action: function (params) {
    if (Meteor.userId()) {
      FlowRouter.go('/dashboard');
    } else {
      BlazeLayout.render("plainLayout", { main: "login" });
    }
  }
});
//
FlowRouter.route('/dashboard', {
  action: function (params) {
    BlazeLayout.render("mainLayout", { main: "dashboard" });
  }
});
//
FlowRouter.route('/users', {
  action: function (params) {
    BlazeLayout.render("mainLayout", { main: "users" });
  }
});
//
FlowRouter.route('/categories', {
  action: function (params) {
    BlazeLayout.render("mainLayout", { main: "categories" });
  }
});
FlowRouter.route('/products', {
  action: function (params) {
    BlazeLayout.render("mainLayout", { main: "products" });
  }
});
FlowRouter.route('/product/:productId?', {
  action: function (params) {
    BlazeLayout.render("mainLayout", { main: "productAddEdit" });
  }
});
//
FlowRouter.route('/options', {
  action: function (params) {
    BlazeLayout.render("mainLayout", { main: "options" });
  }
});
FlowRouter.route('/option/:optionId?', {
  action: function (params) {
    BlazeLayout.render("mainLayout", { main: "optionAddEdit" });
  }
});
//
FlowRouter.route('/banners', {
  action: function (params) {
    BlazeLayout.render("mainLayout", { main: "banners" });
  }
});
//
FlowRouter.route('/notifications', {
  action: function (params) {
    BlazeLayout.render("mainLayout", { main: "notifications" });
  }
});
//
FlowRouter.route('/orders', {
  action: function (params) {
    BlazeLayout.render("mainLayout", { main: "orders" });
  }
});
//
FlowRouter.route('/settings/privacy-policy', {
  action: function (params) {
    BlazeLayout.render("mainLayout", { main: "privacy" });
  }
});
//
FlowRouter.route('/settings/terms-conditions', {
  action: function (params) {
    BlazeLayout.render("mainLayout", { main: "terms" });
  }
});
//
FlowRouter.notFound = {
  action: function() {
    BlazeLayout.render("plainLayout", { main: "errorPage" });
  }
};
