export const userDefs = `
	scalar Date

	type userData {
		_id: String
		profile: userProfile
		email: String
		roles: [roleData]
		createdAt: Date
	}
	type roleData {
		_id: String
	}
	type userProfile {
		name: String
		mobile: String
		photo: String
	}

	type userAuthData {
		_id: ID
		name: String
		email: String
		role: String
		token: String
	}

	type addressData {
		_id: ID
		firstName: String
		lastName: String
		mobile: String
		email: String
		address: String
		area: String
		city: String
		pincode: String
		country: String
		createdAt: Date
	}

	type Query {
		getTempUserId: String
		getUserDetails: userData
		authUser(userId: String, email: String, password: String): userAuthData
		socialLogin(type: String, userId: String, token: String): userAuthData
		getUserAddresses: [addressData]
		getPrivacyPolicy: String
		getTerms: String
	}
	type Mutation {
		addUser(name: String, email: String, password: String, mobile: String): userData
		editUser(name: String, email: String, mobile: String, photo: String): userData
		addAddress(firstName: String, lastName: String, mobile: String, email: String, address: String, area: String, city: String, pincode: String, country: String): addressData
		editAddress(addressId: String!, firstName: String, lastName: String, mobile: String, email: String, address: String, area: String, city: String, pincode: String, country: String): addressData
		removeAddress(addressId: String!): Boolean
	}
`
