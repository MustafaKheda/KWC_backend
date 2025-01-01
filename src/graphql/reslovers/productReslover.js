import { Category } from "../../models/category.model.js";
import Product from "../../models/product.model.js";
// import Category from "../../models/category.model.js"; // Assuming you have a category model

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

                // // If category details are requested, fetch them
                if (fields.includes('category_id')) {
                    const category = await Category.findOne({ category_id: product.category_id });
                    product.category_id = {
                        id: category.category_id,
                        name: category.name,
                    };
                }

                return product;
            } catch (error) {
                throw new Error("Error fetching product: " + error.message);
            }
        },

        // Get all products
        getProducts: async (_, __, context, info) => {
            const fields = info.fieldNodes[0].selectionSet.selections.map(field => field.name.value);
            const projection = {};
            fields.forEach(field => {
                projection[field] = 1; // Include the requested field
            });

            try {
                const products = await Product.find({ isActive: true }, projection);

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
    // Resolver for the Product type's `category` field
    Product: {
        category: async (parent) => {
            console.log(parent)
            if (!parent.category_id) return null;
            try {
                const category = await Category.findOne({ _id: parent.category_id });
                console.log(category)
                return category ? { id: category._id, name: category.name } : null;
            } catch (error) {
                throw new Error("Error fetching category: " + error.message);
            }
        },
    },
    Mutation: {
        // Mutation to update inventory quantity for a product
        updateInventoryQuantity: async (_, { productId, size, quantity }) => {
            try {
                // Find the product by its ID
                const product = await Product.findOne({ product_id: productId });

                if (!product) {
                    throw new Error("Product not found");
                }

                // Find the inventory variant by size
                const inventory = product.inventory.find((item) => item.size === size);

                if (!inventory) {
                    throw new Error("Inventory size not found");
                }

                // Update the stock_quantity
                inventory.stock_quantity = quantity;

                // Save the updated product
                await product.save();

                return {
                    product_id: product.product_id,
                    name: product.name,
                    inventory: product.inventory,
                };
            } catch (error) {
                throw new Error("Error updating inventory: " + error.message);
            }
        },
    },
};
