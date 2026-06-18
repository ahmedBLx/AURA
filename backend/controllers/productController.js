const productService = require('../services/productService');
const { uploadToCloudinary } = require('../config/cloudinary');

class ProductController {
  async getProducts(req, res, next) {
    try {
      const { search, categories, minPrice, maxPrice, sort, page, limit } = req.query;

      // Pagination calculation
      const currentPage = parseInt(page, 10) || 1;
      const currentLimit = parseInt(limit, 10) || 20;
      const skip = (currentPage - 1) * currentLimit;

      // Categories parsing (e.g. comma-separated string)
      let parsedCategories;
      if (categories) {
        parsedCategories = categories.split(',').map(c => c.trim());
      }

      const filters = {
        search,
        categories: parsedCategories,
        minPrice,
        maxPrice,
        sort,
        skip,
        limit: currentLimit
      };

      const { items, total } = await productService.getProducts(filters);

      res.status(200).json({
        status: 'success',
        results: items.length,
        total,
        page: currentPage,
        totalPages: Math.ceil(total / currentLimit),
        data: { products: items },
      });
    } catch (err) {
      next(err);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      res.status(200).json({
        status: 'success',
        data: { product },
      });
    } catch (err) {
      next(err);
    }
  }

  async createProduct(req, res, next) {
    try {
      const data = { ...req.body };

      // Upload primary image to Cloudinary
      if (req.files) {
        if (req.files['img'] && req.files['img'][0]) {
          data.img = await uploadToCloudinary(req.files['img'][0].buffer);
        }
        if (req.files['images'] && req.files['images'].length > 0) {
          data.images = await Promise.all(
            req.files['images'].map(f => uploadToCloudinary(f.buffer))
          );
        }
      }

      // Convert prices and stocks to numbers
      if (data.price) data.price = Number(data.price);
      if (data.stock) data.stock = Number(data.stock);
      if (data.discountPercent) data.discountPercent = Number(data.discountPercent);

      // Parse categories if sent as JSON string or array
      if (typeof data.categories === 'string') {
        try {
          data.categories = JSON.parse(data.categories);
        } catch (e) {
          data.categories = data.categories.split(',').map(c => c.trim());
        }
      }

      // Parse sizes if sent as JSON string or array
      if (typeof data.sizes === 'string') {
        try {
          data.sizes = JSON.parse(data.sizes);
        } catch (e) {
          data.sizes = data.sizes.split(',').map(s => s.trim());
        }
      }

      const product = await productService.createProduct(data, req.user._id);

      res.status(201).json({
        status: 'success',
        data: { product },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const data = { ...req.body };

      // Upload new primary image to Cloudinary if provided
      if (req.files && req.files['img'] && req.files['img'][0]) {
        data.img = await uploadToCloudinary(req.files['img'][0].buffer);
      }

      // Handle secondary images: keep existing URLs + upload new files to Cloudinary
      if (data.existingImages !== undefined || (req.files && req.files['images'])) {
        let existingImages = [];
        if (data.existingImages) {
          if (typeof data.existingImages === 'string') {
            try {
              existingImages = JSON.parse(data.existingImages);
            } catch (e) {
              existingImages = data.existingImages.split(',').map(img => img.trim()).filter(Boolean);
            }
          } else if (Array.isArray(data.existingImages)) {
            existingImages = data.existingImages;
          }
        }

        let newImages = [];
        if (req.files && req.files['images']) {
          newImages = await Promise.all(
            req.files['images'].map(f => uploadToCloudinary(f.buffer))
          );
        }
        data.images = [...existingImages, ...newImages];
      }

      // Type conversion
      if (data.price) data.price = Number(data.price);
      if (data.stock) data.stock = Number(data.stock);
      if (data.discountPercent !== undefined) data.discountPercent = Number(data.discountPercent);

      // Parse categories
      if (typeof data.categories === 'string') {
        try {
          data.categories = JSON.parse(data.categories);
        } catch (e) {
          data.categories = data.categories.split(',').map(c => c.trim());
        }
      }

      // Parse sizes
      if (typeof data.sizes === 'string') {
        try {
          data.sizes = JSON.parse(data.sizes);
        } catch (e) {
          data.sizes = data.sizes.split(',').map(s => s.trim());
        }
      }

      const product = await productService.updateProduct(req.params.id, data, req.user._id);

      res.status(200).json({
        status: 'success',
        data: { product },
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      await productService.deleteProduct(req.params.id, req.user._id);
      res.status(200).json({
        status: 'success',
        message: 'Product successfully deleted',
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProductController();
