const productRepository = require('./product.repository');
const auditLogRepository = require('../audit-logs/audit-log.repository');
const adminRepository = require('../auth/auth.repository');
const AppError = require('../../core/appError');

class ProductService {
  async getProducts(filters) {
    return productRepository.findWithFilters(filters);
  }

  async getProductById(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  }

  async createProduct(data, adminUserId) {
    const existingProduct = await productRepository.findByName(data.name);
    if (existingProduct) {
      throw new AppError('Product with this name already exists', 400);
    }

    const product = await productRepository.create(data);

    const adminUser = await adminRepository.findById(adminUserId);
    await auditLogRepository.create({
      user: adminUserId,
      userName: adminUser ? adminUser.name : 'Admin',
      action: 'CREATE_PRODUCT',
      details: `Created product: ${product.name} (ID: ${product._id})`,
      ipAddress: 'System',
    });

    return product;
  }

  async updateProduct(id, data, adminUserId) {
    if (data.name) {
      const existingProduct = await productRepository.findByName(data.name);
      if (existingProduct && existingProduct._id.toString() !== id) {
        throw new AppError('Product with this name already exists', 400);
      }
    }

    const product = await productRepository.update(id, data);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const adminUser = await adminRepository.findById(adminUserId);
    await auditLogRepository.create({
      user: adminUserId,
      userName: adminUser ? adminUser.name : 'Admin',
      action: 'UPDATE_PRODUCT',
      details: `Updated product: ${product.name} (ID: ${product._id})`,
      ipAddress: 'System',
    });

    return product;
  }

  async deleteProduct(id, adminUserId) {
    const product = await productRepository.delete(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const adminUser = await adminRepository.findById(adminUserId);
    await auditLogRepository.create({
      user: adminUserId,
      userName: adminUser ? adminUser.name : 'Admin',
      action: 'DELETE_PRODUCT',
      details: `Deleted product: ${product.name} (ID: ${product._id})`,
      ipAddress: 'System',
    });

    return product;
  }

  async verifyStock(productId, quantity) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new AppError(`Product with ID ${productId} not found`, 404);
    }
    return product.stock >= quantity;
  }
}

module.exports = new ProductService();
