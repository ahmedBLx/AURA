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
  const client = mongoose.connection.client;
  const isStandalone = !client || client.topology?.description?.type === 'Single';

  if (!isStandalone) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (err) {
      console.warn('[TRANSACTION WARNING] Failed to start session. Falling back to non-transactional execution.');
      session = null;
    }
  } else {
    console.info('[TRANSACTION INFO] Standalone database deployment detected. Running non-transactionally.');
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
