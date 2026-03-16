const mongoose = require('mongoose');

async function closeAllConnections() {
  for (const conn of mongoose.connections) {
    if (conn.readyState !== 0) {
      await conn.close();
    }
  }
}

module.exports = { closeAllConnections };
