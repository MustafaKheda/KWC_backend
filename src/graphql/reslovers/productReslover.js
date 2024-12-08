import Product from "../../models/product.model.js";


export const productResolvers = {
    Query: {
        // Get a single product by ID
        getProduct: async (_, { productId }, context, info) => {
            // Extract requested fields dynamically
            const fields = info.fieldNodes[0].selectionSet.selections.map(field => field.name.value);
            const projection = {};
            fields.forEach(field => {
                projection[field] = 1; // Include the requested field
            });

            try {
                const product = await Product.findOne({ product_id: productId }, projection);
                return product;
            } catch (error) {
                throw new Error("Error fetching product: " + error.message);
            }
        },

        // Get all products
        getProducts: async (_, __, context, info) => {
            console.log(info)
            const fields = info.fieldNodes[0].selectionSet.selections.map(field => field.name.value);
            const projection = {};
            fields.forEach(field => {
                projection[field] = 1; // Include the requested field
            });

            try {
                const products = await Product.find({}, projection);
                return products;
            } catch (error) {
                throw new Error("Error fetching products: " + error.message);
            }
        },
        productCount: async () => {
            // Count products in the database
            return await Product.countDocuments();
        },
    },
};

