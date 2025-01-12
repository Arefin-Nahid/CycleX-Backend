const admin = require('firebase-admin');
const serviceAccount = require('./cyclex-e0009-firebase-adminsdk-mn53w-9275c684a9.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin; 