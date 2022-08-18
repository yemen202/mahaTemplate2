export const cartDefs = `

	type cartData {
		_id: String
		userId: ID
		products: [productObj]
		deliveryCharge: Int
		freeOrderDeliveryLimit: Int
	}

	type productObj {
		productId: ID,
		quantity: Int,
		maxQuantity: Int,
		name: String,
		price: Int,
		specialPrice: Int,
		photos: [String],
		optionValues: [optionValueObj]
	}

	type optionValueObj {
		_id: ID
		name: String
		value: String
		quantity: Int
		price: Int
		pricePrefix: String
	}

	extend type Query {
		getCartDetails (userId: ID): cartData
		isCartProductsAvailable (userId: ID): Boolean
	}

	extend type Mutation {
		updateCart (userId: ID, productId: ID!, quantity: Int, optionValueIds: [String]): Boolean
	}
`
