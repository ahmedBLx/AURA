const customerRepository = require('../repositories/customerRepository');

class CustomerController {
  async getCustomerByPhone(req, res, next) {
    try {
      const { phone } = req.params;
      if (!phone) {
        return res.status(400).json({
          status: 'fail',
          message: 'Phone number is required',
        });
      }

      const customer = await customerRepository.findByPhone(phone.trim());
      if (!customer) {
        return res.status(200).json({
          status: 'success',
          data: {
            found: false,
            customer: null,
          },
        });
      }

      res.status(200).json({
        status: 'success',
        data: {
          found: true,
          customer,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getCustomers(req, res, next) {
    try {
      const { search, sort } = req.query;
      const query = {};

      if (search) {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [
          { phoneNumber: searchRegex },
          { fullName: searchRegex },
          { email: searchRegex },
          { city: searchRegex }
        ];
      }

      let sortOption = { totalSpent: -1 };
      if (sort === 'points-desc') sortOption = { loyaltyPoints: -1 };
      if (sort === 'points-asc') sortOption = { loyaltyPoints: 1 };
      if (sort === 'spent-desc') sortOption = { totalSpent: -1 };
      if (sort === 'spent-asc') sortOption = { totalSpent: 1 };
      if (sort === 'orders-desc') sortOption = { totalOrders: -1 };
      if (sort === 'orders-asc') sortOption = { totalOrders: 1 };
      if (sort === 'name-asc') sortOption = { fullName: 1 };
      if (sort === 'name-desc') sortOption = { fullName: -1 };

      const customers = await customerRepository.model.find(query).sort(sortOption);

      res.status(200).json({
        status: 'success',
        results: customers.length,
        data: { customers }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CustomerController();
