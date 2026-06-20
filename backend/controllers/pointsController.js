const customerRepository = require('../repositories/customerRepository');
const mongoose = require('mongoose');
const AppError = require('../utils/appError');

class PointsController {
  async calculatePoints(req, res, next) {
    try {
      const { phoneNumber, cartSubtotal } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ status: 'fail', message: 'Phone number is required' });
      }

      const parsedSubtotal = Number(cartSubtotal) || 0;
      const customer = await customerRepository.findByPhone(phoneNumber.trim());
      
      const currentPoints = customer ? customer.loyaltyPoints : 0;
      const eligiblePoints = Math.floor(currentPoints / 1000) * 1000;
      const eligibleDiscount = (eligiblePoints / 1000) * 100;
      
      // Cap discount at subtotal (in blocks of 100 EGP / 1000 points)
      let maxDiscount = eligibleDiscount;
      if (maxDiscount > parsedSubtotal) {
        maxDiscount = Math.floor(parsedSubtotal / 100) * 100;
      }
      const pointsToUse = (maxDiscount / 100) * 1000;

      res.status(200).json({
        status: 'success',
        data: {
          currentPoints,
          eligiblePoints,
          eligibleDiscount,
          maxDiscount,
          pointsToUse,
          potentialPointsEarned: Math.max(0, Math.round(parsedSubtotal - maxDiscount))
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async redeemPoints(req, res, next) {
    let session = null;
    try {
      const { phoneNumber, pointsToRedeem } = req.body;
      if (!phoneNumber || !pointsToRedeem) {
        return res.status(400).json({ status: 'fail', message: 'Phone number and pointsToRedeem are required' });
      }

      const pts = Number(pointsToRedeem);
      if (isNaN(pts) || pts <= 0 || pts % 1000 !== 0) {
        return res.status(400).json({ status: 'fail', message: 'Points to redeem must be a positive multiple of 1000' });
      }

      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch (e) {
        session = null;
      }

      const opts = session ? { session } : {};
      const customer = await customerRepository.model.findOne({ phoneNumber: phoneNumber.trim() }).session(session || null);
      
      if (!customer) {
        throw new AppError('Customer profile not found', 404);
      }

      if (customer.loyaltyPoints < pts) {
        throw new AppError(`Insufficient points. Balance: ${customer.loyaltyPoints}, Requested: ${pts}`, 400);
      }

      customer.loyaltyPoints -= pts;
      await customer.save(opts);

      if (session) {
        await session.commitTransaction();
      }

      res.status(200).json({
        status: 'success',
        message: 'Points successfully redeemed',
        data: {
          phoneNumber: customer.phoneNumber,
          loyaltyPoints: customer.loyaltyPoints
        }
      });
    } catch (err) {
      if (session) {
        await session.abortTransaction();
      }
      next(err);
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  async earnPoints(req, res, next) {
    let session = null;
    try {
      const { phoneNumber, amountSpent } = req.body;
      if (!phoneNumber || amountSpent === undefined) {
        return res.status(400).json({ status: 'fail', message: 'Phone number and amountSpent are required' });
      }

      const spent = Number(amountSpent);
      if (isNaN(spent) || spent < 0) {
        return res.status(400).json({ status: 'fail', message: 'Amount spent must be a non-negative number' });
      }

      const pointsToEarn = Math.round(spent);

      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch (e) {
        session = null;
      }

      const opts = session ? { session } : {};
      const customer = await customerRepository.model.findOne({ phoneNumber: phoneNumber.trim() }).session(session || null);

      if (!customer) {
        throw new AppError('Customer profile not found', 404);
      }

      customer.loyaltyPoints += pointsToEarn;
      customer.totalSpent += spent;
      await customer.save(opts);

      if (session) {
        await session.commitTransaction();
      }

      res.status(200).json({
        status: 'success',
        message: 'Points successfully earned',
        data: {
          phoneNumber: customer.phoneNumber,
          loyaltyPoints: customer.loyaltyPoints
        }
      });
    } catch (err) {
      if (session) {
        await session.abortTransaction();
      }
      next(err);
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }
}

module.exports = new PointsController();
