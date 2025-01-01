import { gql } from "apollo-server-express";
export const productSchema = gql`
type Inventory {
    stock_quantity: Int!
    size: Float
    base_price: Float!
    discounted_price: Float
    cost: Float!
    SKU:String
}
type Category {
  id: ID!
  name: String!
}
type Image {
    main_image: String!
    additional_images: [String]
}

type Review {
    user_id: String
    rating: Int
    comment: String
}

type CustomerReviews {
    ratings: Float
    review: [Review]
}

type Promotions {
    discount_percentage: Float
    sale_end_date: String
}

type Product {
    product_id: String!
    name: String!
    description: String!
    isActive: Boolean
    status: String
    category_id: String
    category: Category # Add this field
    subcategory_id: String
    inventory: [Inventory]
    images: Image
    attributes: ProductAttributes
    brand_name: String!
    customer_reviews: CustomerReviews
    promotions: Promotions
}

type ProductAttributes {
    currency: String!
    size_unit: String
    supplier: String
    SKU: String
}

type Query {
    getProduct(productId: String!): Product
    getProducts: [Product]
    productCount:Int
}
type Mutation {
    updateInventoryQuantity(productId: String!, size: Float!, stock_quantity: Int!): Product
}
`
