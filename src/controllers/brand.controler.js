import Brand from "../models/brand.model.js";

// Create a new brand
export const createBrand = async (req, res) => {
    try {
        const { name, description, logo } = req.body;

        const brand = new Brand({ name, description, logo });
        await brand.save();

        res.status(201).json(brand);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all brands
export const getAllBrands = async (req, res) => {
    try {
        const brands = await Brand.find();
        res.status(200).json(brands);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single brand by ID
export const getBrandById = async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);
        if (!brand) {
            return res.status(404).json({ message: "Brand not found" });
        }
        res.status(200).json(brand);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a brand
export const updateBrand = async (req, res) => {
    try {
        const { name, description, logo, isActive } = req.body;

        const brand = await Brand.findByIdAndUpdate(
            req.params.id,
            { name, description, logo, isActive },
            { new: true }
        );

        if (!brand) {
            return res.status(404).json({ message: "Brand not found" });
        }

        res.status(200).json(brand);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a brand
export const deleteBrand = async (req, res) => {
    try {
        const brand = await Brand.findByIdAndDelete(req.params.id);
        if (!brand) {
            return res.status(404).json({ message: "Brand not found" });
        }
        res.status(200).json({ message: "Brand deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
