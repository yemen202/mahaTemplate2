export const categoriesDefs = `

	type categoriesData {
		_id: String
		name: String
		photo: String
		parentId: String
	}

	type categoryWithCount {
		categories: [categoriesData],
		totalCategory: Int
	}

	extend type Query {
		getCategories(limit: Int, skip: Int, categoryId: ID): categoryWithCount
	}
`
