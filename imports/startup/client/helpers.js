import { Template } from 'meteor/templating'
import { Roles } from 'meteor/alanning:roles'

Template.registerHelper('checkUserRole', function(role) {
  return Roles.userIsInRole(Meteor.userId(), role)
})

//
Template.registerHelper('getUserName', function (id) {
  const user = Meteor.users.findOne({_id: id})
  return user && user.profile ? user.profile.name : ''
})

//
Template.registerHelper('refreshTable', function () {
  Meteor.defer(function() {
    $('.footable').trigger('footable_initialize')
  })
})

//
Template.registerHelper('filterChange', function (tableId) {
  Meteor.defer(function() {
    $(`#${tableId}`).footable().bind({
      'footable_filtered': function() {
        var trs = document.querySelectorAll(`#${tableId} tbody tr`), hide = true
        for (var tr of trs) {
          if (!tr.style.display || (tr.style.display && tr.style.display !== 'none')) {
            hide = false
            break
          }
        }
        if(hide && !$(`#${tableId}EmptyMsg`).length) {
          const totalColumn = $(`#${tableId}`).find('thead tr:first th').length
          $(`#${tableId} > tbody`).append(`<tr id=${tableId}EmptyMsg class='d-table-row'><td align='center' colspan=${totalColumn}>No record found</td></tr>`)
        } else if(!hide && $(`#${tableId}EmptyMsg`).length) $(`#${tableId}EmptyMsg`).remove()
  		}
    })
  })
})
