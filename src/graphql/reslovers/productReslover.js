import { Category } from "../../models/category.model.js";
import Product from "../../models/product.model.js";
import { Subcategory } from "../../models/subcategory.model.js";
import { getPagination } from "../../utils/pagination.js";
// import Category from "../../models/category.model.js"; // Assuming you have a category model

export const productResolvers = {
    Query: {
        // Get a single product by ID
        getProduct: async (_, { productId }, context, info) => {
            // Extract requested fields dynamically
            const fields = info.fieldNodes[0].selectionSet.selections.map(field => field.name.value);
            const projection = {
                category_id: 1,  // Include category_id in the result
                subcategory_id: 1  // Include subcategory_id in the result
            };
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
        getProducts: async (_, { limit = null, offset = 0 }, context, info) => {

            console.log(info.fieldNodes[0].selectionSet.selections)
            const fields = info.fieldNodes[0].selectionSet.selections[0].selectionSet.selections.map(field => field.name.value);
            const projection = {
                category_id: 1,  // Include category_id in the result
                subcategory_id: 1  // Include subcategory_id in the result
            };
            fields.forEach(field => {
                projection[field] = 1; // Include the requested field
            });

            try {
                // Count the total number of products
                const totalCount = await Product.countDocuments({ isActive: true });
                let products;

                if (limit) {
                    const { skip, limit: limitNumber } = getPagination(offset, limit);
                    // If a limit is provided, apply pagination
                    products = await Product.find({ isActive: true }, projection)
                        .skip(skip)
                        .limit(limitNumber);
                } else {
                    // No limit provided, fetch all products
                    products = await Product.find({ isActive: true }, projection);
                }

                // Calculate total pages only if limit is provided
                const totalPages = limit ? Math.ceil(totalCount / limit) : 1;

                return {
                    products,
                    totalCount,
                    totalPages,
                    currentPage: parseInt(offset, 10) || 1,
                    pageSize: limit || totalCount, // If no limit, return all items on a single page
                };
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
                return category ? { id: category._id, name: category.name } : null;
            } catch (error) {
                throw new Error("Error fetching category: " + error.message);
            }
        },
        subcategory: async (parent) => {
            console.log(parent)
            if (!parent.subcategory_id) return null;
            try {
                return await Subcategory.findOne({ _id: parent.subcategory_id });
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
        updateInventory: async (_, { productId, inventory }) => {
            try {
                if (!productId || !Array.isArray(inventory) || inventory.length === 0) {
                    throw new Error("Invalid input: productId and inventory are required.");
                }

                // Find and update the product's inventory
                const product = await Product.findOneAndUpdate(
                    { product_id: productId },
                    { inventory: inventory },
                    { new: true } // Return the updated product
                );

                if (!product) {
                    throw new Error("Product not found");
                }

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
