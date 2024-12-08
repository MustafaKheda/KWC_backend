const resolvers = {
    Query: {
        getProducts: async (_, __, context, info) => {
            // Get the requested fields from the query (i.e., dynamic fields)
            const fields = info.fieldNodes[0].selectionSet.selections.map(
                (field) => field.name.value
            );

            // Create a projection object based on the requested fields
            const projection = {};
            fields.forEach((field) => {
                projection[field] = 1; // 1 means include the field in the result
            });

            try {
                // Fetch products from MongoDB with the projection (only the requested fields)
                const products = await Product.find({}, projection);
                return products;
            } catch (error) {
                throw new Error("Error fetching products: " + error.message);
            }
        },
    },
};