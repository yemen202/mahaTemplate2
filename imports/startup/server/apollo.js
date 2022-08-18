// Apollo
// import { getUser } from 'meteor/apollo'
import { ApolloServer, gql } from 'apollo-server-express'
import jwt from 'jsonwebtoken'
// Engine
import { WebApp } from 'meteor/webapp'

const SECRET = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'

// Schema & Resolver
import { userDefs } from '/imports/api/graphql/users/schema'
import { userResolvers } from '/imports/api/graphql/users/resolver'

import { productDefs } from '/imports/api/graphql/products/schema'
import { productResolvers } from '/imports/api/graphql/products/resolver'

import { categoriesDefs } from '/imports/api/graphql/categories/schema'
import { categoriesResolvers } from '/imports/api/graphql/categories/resolver'

import { bannersDefs } from '/imports/api/graphql/banners/schema'
import { bannersResolvers } from '/imports/api/graphql/banners/resolver'

import { cartDefs } from '/imports/api/graphql/carts/schema'
import { cartResolvers } from '/imports/api/graphql/carts/resolver'

import { notificationDefs } from '/imports/api/graphql/notifications/schema'
import { notificationResolvers } from '/imports/api/graphql/notifications/resolver'

import { orderDefs } from '/imports/api/graphql/orders/schema'
import { orderResolvers } from '/imports/api/graphql/orders/resolver'

const allQuery = { Query: _.extend(userResolvers['Query'], productResolvers['Query'], categoriesResolvers['Query'], bannersResolvers['Query'], cartResolvers['Query'], notificationResolvers['Query'], orderResolvers['Query']) }
const allMutation = { Mutation: _.extend(userResolvers['Mutation'], cartResolvers['Mutation'], orderResolvers['Mutation']) }

const typeDefs = [userDefs, productDefs, categoriesDefs, bannersDefs, cartDefs, notificationDefs, orderDefs];
const resolvers = _.extend({}, allQuery, allMutation);

const getUser = (req) => {
	const token = req.headers['authorization']
	try {
		if (token) { // If Header has token
			const { user } = jwt.verify(token, SECRET) // If the token is valid then assign data into the user otherwise throw error;
			if (user) {
        const userObj = Meteor.users.findOne(user._id)
        return userObj // Return user data
      } else {
        return null
      }
		} else {
			return null // If token is not present in the header then return null
		}
	} catch (err) {
		// console.log({name: 'JsonWebTokenError', message: 'invalid token' })
		return false // If token is invalid then return false
	}
	// req.next(); // forword the req to further process.
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => ({
    SECRET: SECRET,
    user: await getUser(req)
  }),
	tracing: true
})
server.applyMiddleware({
  app: WebApp.connectHandlers,
  path: '/graphql'
})
WebApp.connectHandlers.use('/graphql', (req, res) => {
  if (req.method === 'GET') {
    res.end()
  }
})
