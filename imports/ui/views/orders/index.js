import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
//
import { Orders } from '/imports/api/orders/collection'

import './modals/add-edit-order.js'
import './index.html'

Template.orders.onCreated(function () {
  const self = this
  self.selectedOrder = new ReactiveVar({})
  self.filter = new ReactiveVar({})

  self.autorun(function () {
    self.subsOrders = self.subscribe('orders')
  })
})

Template.orders.rendered = function() {
  Blaze._globalHelpers.filterChange('orderListTable')
}

Template.orders.helpers({
  isReady () {
    return Template.instance().subsOrders.ready()
  },
  orders () {
    const query = {}, filter = Template.instance().filter.get()
    if(filter.status) query['status'] = filter.status
    if(filter.fromDate && filter.toDate) query['createdAt'] = { '$gte': new Date(filter.fromDate + " 0:0:0"), '$lte': new Date(filter.toDate + " 23:59:59") }
    if(filter.fromDate && !filter.toDate) query['createdAt'] = { '$gte': new Date(filter.fromDate + " 0:0:0") }
    else if(!filter.fromDate && filter.toDate) query['createdAt'] = { '$lte': new Date(filter.toDate + " 23:59:59") }
    return Orders.find(query).fetch()
  },
  selectedOrder () {
    const instance = Template.instance()
    return instance.selectedOrder.get()
  },
  getDate (date) {
    return moment(date).format('DD MMM YYYY h:mm A');
  },
  email () {
    const user = Meteor.users.findOne({_id: this.userId})
    if (user && user.emails && user.emails.length && user.emails[0].address) return user.emails[0].address
    else return ''
  },
  statusList () {
    return ['Placed', 'Delivered', 'Cancelled']
  }
})

Template.orders.events({
  'change #filterStatus, change #filterByFromDate, change #filterByToDate' (event, template) {
    event.preventDefault()
    const filterValue = template.filter.get()
    filterValue[event.target.name] = event.target.value
    template.filter.set(filterValue)
  },
  'click .btn-list' (event, template) {
    event.preventDefault()
    const order = this
    template.selectedOrder.set(order)
    $('#orderAddEditModal').modal('show')
  },
  'hidden.bs.modal #orderAddEditModal' (event, template) {
    template.selectedOrder.set({})
  },
  'click .download-pdf' (event, template) {
    event.preventDefault()
    $this = $(event.currentTarget)
    $this.prop('disabled', true)
    $this.addClass('active')
    //
    var width = $('#page-wrapper').width()
		var height = $('#page-wrapper').height()
    //
    const order = this
    //
    Meteor.call('generateOrderReceiptPDF', order._id, width, height, function (error, result) {
			$this.prop('disabled', false)
			$this.removeClass('active')
			if (error) {
        return toastr.error(error.reason)
			} else if (result) {
				var linkData = "data:application/pdf;base64, " + result
        var dlnk = document.getElementById('dwnldOdrLnk')
        const user = Meteor.users.findOne({_id: order.userId})
        if (user && user.profile) dlnk.download = `order-${user.profile.name}.pdf`
        else if (order.mobile) dlnk.download = `order-${order.mobile}.pdf`
		    dlnk.href = linkData

		    dlnk.click()
        Meteor.defer(function () {
          dlnk.download = `OrderReceipt.pdf`
        })
			}
		});
  },
  'click .btn-decline' (event, template) {
    const order = this
    sweetAlert({
      title: 'Are you sure?',
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#de4436',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      closeOnConfirm: true,
      html: false
    }, (isConfirm) => {
      Meteor.call('declineOrder', order._id, (error, result) => {
        if (error) {
          return toastr.error(error.reason)
        } else {
          return toastr.success('Order cancelled Successfully')
        }
      })
    })
  },
  'click .btn-set-delivered' (event, template) {
    event.preventDefault()
    const order = this
    sweetAlert({
      title: 'Are you sure?',
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1ab394',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      closeOnConfirm: true,
      html: false
    }, (isConfirm) => {
      if (isConfirm) {
        Meteor.call('deliverOrder', order._id, (error, result) => {
          if (error) return toastr.error(error.reason)
          else {
            return toastr.success('Order delivered Successfully')
          }
        })
      }
    })
  }
})
