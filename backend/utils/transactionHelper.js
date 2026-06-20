const mongoose = require('mongoose');

/**
 * Execute operations within a MongoDB transaction.
 * If the current MongoDB deployment does not support transactions/sessions (e.g., local standalone server),
 * it falls back to standard execution while outputting a warning.
 * 
 * @param {Function} callback - Async function containing operations to run. Receives the session object.
 * @returns {Promise<any>} - Resolves with the callback's return value.
 */
const runInTransaction = async (callback) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    console.warn('[TRANSACTION WARNING] standalone database deployment detected. Sessions/transactions are not supported. Falling back to non-transactional execution.');
    session = null;
  }

  try {
    const result = await callback(session);
    if (session) {
      await session.commitTransaction();
    }
    return result;
  } catch (err) {
    if (session) {
      await session.abortTransaction();
    }
    throw err;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

module.exports = { runInTransaction };
