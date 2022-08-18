export const bannersDefs = `

	type bannersData {
		_id: String
		photo: String
		visible: Boolean
	}

	extend type Query {
		getBanners: [bannersData]
	}
`
