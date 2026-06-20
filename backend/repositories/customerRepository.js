const BaseRepository = require('./baseRepository');
const Customer = require('../models/Customer');

class CustomerRepository extends BaseRepository {
  constructor() {
    super(Customer);
  }

  async findByPhone(phoneNumber) {
    return this.model.findOne({ phoneNumber });
  }
}

module.exports = new CustomerRepository();
