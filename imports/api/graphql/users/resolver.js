import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import _ from 'underscore';
import jwt from 'jsonwebtoken'
import { Core } from '/imports/api/lib/core.js'
import { Addresses } from '/imports/api/addresses/collection'
import { Carts } from '/imports/api/carts/collection'
import { Settings } from '/imports/api/settings/collection'

export const userResolvers = {
	Query: {
     authUser(root, args, context) {
      if (args && args.email && args.password) {
				const email = args.email.toLowerCase()
        const user = Meteor.users.findOne({ 'emails.address': email })

        if (!user) {
          throw new Error('Email is incorrect')
        }
        if (user && user.services && user.services.password && user.services.password.bcrypt) {
          const digest = Package.sha.SHA256(args.password)
          const password = { digest: digest, algorithm: 'sha-256' }
          const passCheck = Accounts._checkPassword(user, password)
          if (passCheck.error) {
            throw new Error('Password is incorrect')
          } else {
            let cart = null
            if (args.userId) cart = Carts.findOne({ userId: args.userId })
            // Creating JWT token with user data and expires in 24 Hours
            const token = jwt.sign({ user: _.extend({email: user.emails[0].address}, _.pick(user, ['_id', 'roles'])) }, context.SECRET, { expiresIn: '2400h' })
            Meteor.users.update({ _id: user._id }, { $set: { 'profile.appToken': token } })

            const data = { _id: user._id, name: user.profile.name, email: args.email, token: token}
            if (user.roles) {
              if (Roles.userIsInRole(user._id, ['admin'])) data.role = 'admin'
              else if (Roles.userIsInRole(user._id, ['customer'])) data.role = 'customer'
              else {}
              // role: user.roles ? user.roles[0] : '',
            }

            if (cart) {
              // Check user has cart already
              const cartExists = Carts.findOne({userId: user._id})
              if (cartExists) Carts.remove({_id: cartExists._id})
              // Replace tempId to userId
              Carts.update({_id: cart._id}, { $set: { userId: user._id } })
            }

            return data
          }
        } else {
          throw new Error('Password is not set')
        }
      } else {
        throw new Error('Invalid details')
      }
    },
		socialLogin(root, args, context) {
			if (args && args.token && args.type) {
				var verifyUrl = ''
				if(args.type === 'google') verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${args.token}`
				else if(args.type === 'facebook') verifyUrl = `https://graph.facebook.com/v3.0/me?fields=id,name,email&access_token=${args.token}`

				const response = HTTP.call('GET', verifyUrl)
				if(response && response.data) {
					const data = {}

					if(args.type === 'google') {
						data['id'] = response.data.sub || ''
						data['idToken'] = args.token
						data['email'] = response.data.email || ''
						data['name'] = response.data.name || ''
					}

					if(args.type === 'facebook') {
						data['id'] = response.data.id || ''
						data['accessToken'] = args.token
						data['email'] = response.data.email || ''
						data['name'] = response.data.name || ''
					}

					const userObj = Accounts.updateOrCreateUserFromExternalService(args.type, data);
					if(!userObj.userId)  throw new Error('Failed to login')

					if(response.data.email) Accounts.addEmail(userObj.userId, response.data.email)

					const token = jwt.sign({ user: {'_id': userObj.userId, 'emails': [{ address: response.data.email ? response.data.email : '' }], 'roles': [{ _id : "customer" }]} }, context.SECRET, { expiresIn: '2400h' })

					const updateObj = { role: 'customer' }
					if(response.data.name) updateObj['profile.name'] = response.data.name
					updateObj['profile.appToken'] = token

					Meteor.users.update({ _id: userObj.userId }, { $set: updateObj })
					Roles.addUsersToRoles(userObj.userId, ['customer']);

					let cart = null
					if (args.userId) cart = Carts.findOne({ userId: args.userId })
					if (cart) {
						// Check user has cart already
						const cartExists = Carts.findOne({ userId: userObj.userId })
						if (cartExists) Carts.remove({_id: cartExists._id})
						// Replace tempId to userId
						Carts.update({_id: cart._id}, { $set: { userId: userObj.userId } })
					}
					return { _id: userObj.userId, name: response.data.name ? response.data.name : '', email: response.data.email ? response.data.email : '', token }
				} else {
					throw new Error('Failed to login')
				}
			} else {
				throw new Error('Invalid details')
			}
		},
    getTempUserId (root, args, context) {
      return Random.id()
    },
    getUserDetails(root, args, context) {
      const user = Core.validateTokenUser(context.user)
      if (user) {
        const email = (user.emails && user.emails.length && user.emails[0].address) ? user.emails[0].address : ''
        return _.extend({email}, _.pick(user, ['_id', 'profile', 'roles', 'email', 'createdAt']))
      } else {
        throw new Error('User not found')
      }
    },
		getUserAddresses(root, args, context) {
			const user = Core.validateTokenUser(context.user)
      if (user) {
				if(user && user.addresses && user.addresses.length > 0) return Addresses.find({ _id: { $in: user.addresses } }, { sort: { createdAt: -1 } })
				return []
			} else {
				throw new Error('User not found')
			}
		},
		getPrivacyPolicy(root, args, context) {
			const privacyPolicy = Settings.findOne({_id: 'Privacy_Policy'})
			if (privacyPolicy && privacyPolicy.value) return privacyPolicy.value
			else return ''
		},
		getTerms(root, args, context) {
			const terms = Settings.findOne({_id: 'Terms_Conditions'})
			if (terms && terms.value) return terms.value
			else return ''
		}
  },
  Mutation: {
    addUser (root, args, context) {
      if (args && args.name && args.email && args.password) {
        const email = args.email.toLowerCase()
        if (Core.validateEmail(email)) {
          const userWithEmail = Meteor.users.findOne({ 'emails.address': email })
          if (userWithEmail) {
            throw new Error('Email already exists')
          }
          const role = 'customer'

          const userData = {
            email: email,
            password: args.password,
            profile: {
              name: args.name,
							mobile: args.mobile || ''
            },
            role
          }
		      //
          const userId = Accounts.createUser(userData)
          Roles.addUsersToRoles(userId, ['customer']);

          const user = Meteor.users.findOne(userId)

          return _.extend({email}, _.pick(user, ['_id', 'profile', 'roles', 'createdAt']))
        } else {
          throw new Error('Invalid email')
        }
      } else {
        throw new Error('Invalid details')
      }
    },
    editUser (root, args, context) {
      const user = Core.validateTokenUser(context.user)

      if (user) {
        var updateObj = {}
        if (args && args.email) {
          if (Core.validateEmail(args.email)) {
						const email = args.email.toLowerCase()
            const userWithEmail = Meteor.users.findOne({ _id: { $ne: user._id }, 'emails.address': email })
            if (userWithEmail) {
              throw new Error('Email already exists')
            } else {
              updateObj['emails.0.address'] = email
            }
          } else {
              throw new Error('Invalid email')
          }
        }

        if (args.name) updateObj['profile.name'] = args.name
        if (args.photo) updateObj['profile.photo'] = args.photo
				if (args.mobile) updateObj['profile.mobile'] = args.mobile

        var query = {$set: updateObj}

        const updated = Meteor.users.update({ _id: user._id }, query)

        if (updated) {
          const userObj = Meteor.users.findOne(user._id)
					userObj.email = args.email ? args.email : (userObj.emails && userObj.emails[0] && userObj.emails[0].address ? userObj.emails[0].address : '')
					return _.pick(userObj, ['_id', 'profile', 'email', 'roles', 'createdAt'])
        } else {
          throw new Error('Not updated, invalid values')
        }
      } else {
        throw new Error('User not found')
      }
    },
		addAddress (root, args, context) {
			const user = Core.validateTokenUser(context.user)
			if (user) {
				if (args && args.mobile && args.address && args.area && args.city && args.pincode && args.country) {
					const addressData = {
						firstName: args.firstName || '',
						lastName: args.lastName || '',
						mobile: args.mobile,
						email: args.email || '',
						address: args.address,
						area: args.area,
						city: args.city,
						pincode: args.pincode,
						country: args.country
					}
					const addressId = Addresses.insert(addressData)
					if(addressId) {
						Meteor.users.update({ _id: user._id }, { $push: { addresses: addressId } })
						return Addresses.findOne(addressId)
					} else {
	          throw new Error('Not added, invalid values')
	        }
				} else {
	        throw new Error('Invalid details')
	      }
			} else {
        throw new Error('User not found')
      }
		},
		editAddress (root, args, context) {
			const user = Core.validateTokenUser(context.user)
			if (user) {
				if (args && args.addressId && user.addresses && user.addresses.includes(args.addressId)) {
					var updateObj = {}
					if (args.firstName) updateObj['firstName'] = args.firstName
	        if (!_.isUndefined(args.lastName)) updateObj['lastName'] = args.lastName
	        if (args.mobile) updateObj['mobile'] = args.mobile
	        if (args.email) updateObj['email'] = args.email
	        if (args.address) updateObj['address'] = args.address
	        if (args.area) updateObj['area'] = args.area
					if (args.city) updateObj['city'] = args.city
					if (args.pincode) updateObj['pincode'] = args.pincode
					if (args.country) updateObj['country'] = args.country

	        const updated = Addresses.update({ _id: args.addressId }, { $set: updateObj })
					if(updated) {
						return Addresses.findOne(args.addressId)
					} else {
	          throw new Error('Not updated, invalid values')
	        }
				} else {
	        throw new Error('Invalid details')
	      }
			} else {
        throw new Error('User not found')
      }
		},
		removeAddress (root, args, context) {
			const user = Core.validateTokenUser(context.user)
			if (user) {
				if (args && args.addressId) {
					const address = Addresses.findOne(args.addressId)
					if(address && address._id && user.addresses && user.addresses.includes(address._id)) {
						Meteor.users.update({ _id: user._id }, { $pull: { addresses: address._id } })
						return Addresses.remove({_id: address._id })
					} else {
						throw new Error('Invalid address')
					}
				} else {
	        throw new Error('Invalid details')
	      }
			} else {
        throw new Error('User not found')
      }
		}
  }
}
