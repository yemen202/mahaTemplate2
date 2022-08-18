export const productDefs = `
	type productData {
		_id: String
		name: String
		price: Int
		specialPrice: Int
		categories: [String]
		photos: [String]
	}

	input discountInput {
		type: String
		value: Int
	}

	input priceInput {
		minPrice: Int
		maxPrice: Int
	}

	input filterInput {
		priceRange: [priceInput]
		discount: discountInput
	}

	type productWithCount {
		products: [productData],
		totalProduct: Int
	}

	type optionsData {
		_id: String
		name: String
		type: String
		optionValues: [optionValues]
	}

	type optionValues {
		_id: String
		value: String
		quantity: Int
		price: Int
		pricePrefix: String
	}

	type productDetailData {
		_id: String
		name: String
		shortDescription: String
		description: String
		price: Int
		specialPrice: Int
		quantity: Int
		categories: [String]
		photos: [String]
		similarProducts: [productData]
		options: [optionsData]
		deliveryCharge: Int
		freeOrderDeliveryLimit: Int
	}

	extend type Query {
		getProducts (limit: Int, skip: Int, search: String, categoryId: ID, sortBy: String, filter: filterInput, type: String, productId: String): productWithCount
		getProductDetails (productId: String!): productDetailData
	}
`
