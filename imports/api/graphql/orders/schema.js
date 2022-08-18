export const orderDefs = `

	type orderData {
		_id: String
		userId: ID
		products: [orderedProductData]
		subTotal: Int
		deliveryCharge: Int
		totalPrice: Int
		totalDiscount: Int
		status: String
		code: String
		createdAt: Date
		deliveryAddress: addressData
	}

	type orderedProductData {
		productId: ID
		photos: [String]
		name: String
		categories: [String]
		quantity: Int
		price: Int
		discount: Int
		sellPrice: Int
		options: [optionObj]
	}

	type optionObj {
		optionValueId: ID
		name: String
		value: String
	}

	type orderWithCount {
		orders: [orderData],
		totalOrder: Int
	}

	input productInput {
		productId: ID,
		quantity: Int,
		optionValueIds: [String]
	}

	extend type Query {
		getOrders(limit: Int, skip: Int, status: String): orderWithCount
		getOrderDetails(orderId: String!): orderData
	}
	extend type Mutation {
		placeOrder(subTotal: Int!, deliveryCharge: Int!, totalPrice: Int!, totalDiscount: Int, paymentType: String!, tokenId: String, addressId: String, type: String, product: productInput): Boolean
		cancelOrder(orderId: String!):Boolean
	}
`
