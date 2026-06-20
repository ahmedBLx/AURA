const categoryService = require('../services/categoryService');

class CategoryController {
  async getCategories(req, res, next) {
    try {
      const categories = await categoryService.getCategories();
      res.status(200).json({
        status: 'success',
        data: { categories },
      });
    } catch (err) {
      next(err);
    }
  }

  async getHomepageCategories(req, res, next) {
    try {
      const categories = await categoryService.getHomepageCategories();
      res.status(200).json({
        status: 'success',
        data: { categories },
      });
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req, res, next) {
    try {
      const { name, parentId, showOnHomepage } = req.body;
      const category = await categoryService.createCategory({
        name,
        parentId,
        showOnHomepage,
        adminUserId: req.user._id,
      });

      res.status(201).json({
        status: 'success',
        data: { category },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const category = await categoryService.updateCategory(id, updates, req.user._id);

      res.status(200).json({
        status: 'success',
        data: { category },
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const { name } = req.params;
      await categoryService.deleteCategory(name, req.user._id);

      res.status(200).json({
        status: 'success',
        message: `Category "${name}" and its associations deleted successfully`,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CategoryController();
