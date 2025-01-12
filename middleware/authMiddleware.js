const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account
const serviceAccount = require('../config/cyclex-e0009-firebase-adminsdk-mn53w-9275c684a9.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }
        
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authMiddleware; 