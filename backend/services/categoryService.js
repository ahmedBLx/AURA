const categoryRepository = require('../repositories/categoryRepository');
const productRepository = require('../repositories/productRepository');
const auditLogRepository = require('../repositories/auditLogRepository');
const adminRepository = require('../repositories/adminRepository');
const AppError = require('../utils/appError');

class CategoryService {
  async getCategories() {
    return categoryRepository.findAllPopulated({}, { name: 1 });
  }

  async getHomepageCategories() {
    return categoryRepository.findHomepageCategories();
  }

  async createCategory({ name, parentId, showOnHomepage, adminUserId }) {
    const trimmedName = name.trim();
    const existing = await categoryRepository.findByName(trimmedName);
    if (existing) {
      throw new AppError('Category already exists', 400);
    }

    if (!parentId) {
      throw new AppError('Only sub-categories can be created. Please select one of the four main categories as a parent.', 400);
    }

    let parentObj = null;
    if (parentId) {
      parentObj = await categoryRepository.findById(parentId);
      if (!parentObj) {
        throw new AppError('Parent category not found', 404);
      }
    }

    const category = await categoryRepository.create({
      name: trimmedName,
      parent: parentObj ? parentObj._id : null,
      showOnHomepage: showOnHomepage || false,
    });

    // Audit log
    const adminUser = await adminRepository.findById(adminUserId);
    await auditLogRepository.create({
      user: adminUserId,
      userName: adminUser ? adminUser.name : 'Admin',
      action: 'CREATE_CATEGORY',
      details: `Created category: ${category.name} (ID: ${category._id})${parentObj ? ` under parent: ${parentObj.name}` : ''}`,
      ipAddress: 'System',
    });

    // Return populated category
    return categoryRepository.findAllPopulated({ _id: category._id }).then(res => res[0]);
  }

  async updateCategory(id, updates, adminUserId) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const updated = await categoryRepository.updateById(id, updates);

    // Audit log
    const adminUser = await adminRepository.findById(adminUserId);
    await auditLogRepository.create({
      user: adminUserId,
      userName: adminUser ? adminUser.name : 'Admin',
      action: 'UPDATE_CATEGORY',
      details: `Updated category: ${category.name} — ${JSON.stringify(updates)}`,
      ipAddress: 'System',
    });

    return categoryRepository.findAllPopulated({ _id: id }).then(res => res[0]);
  }

  async deleteCategory(name, adminUserId) {
    const category = await categoryRepository.findByName(name);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    if (['Men', 'Women', 'Offers', 'Special Collection'].includes(category.name)) {
      throw new AppError('Core main categories cannot be deleted', 400);
    }

    // Delete subcategories first or set parent to null
    const subcategories = await categoryRepository.findSubcategories(category._id);
    for (const sub of subcategories) {
      sub.parent = null;
      await sub.save();
    }

    await categoryRepository.delete(category._id);

    // Clean up category references in products
    const Product = require('../models/Product'); // direct reference or via repository update
    await Product.updateMany(
      { categories: category.name },
      { $pull: { categories: category.name } }
    );

    // Audit log
    const adminUser = await adminRepository.findById(adminUserId);
    await auditLogRepository.create({
      user: adminUserId,
      userName: adminUser ? adminUser.name : 'Admin',
      action: 'DELETE_CATEGORY',
      details: `Deleted category: ${category.name}`,
      ipAddress: 'System',
    });

    return category;
  }
}

module.exports = new CategoryService();
