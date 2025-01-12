import admin from '../config/firebase.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        message: 'No authorization header',
        error: 'UNAUTHORIZED'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Invalid authorization format',
        error: 'UNAUTHORIZED'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        message: 'No token provided',
        error: 'UNAUTHORIZED'
      });
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (firebaseError) {
      console.error('Firebase auth error:', firebaseError);
      return res.status(401).json({
        message: 'Invalid or expired token',
        error: 'UNAUTHORIZED'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      message: 'Authentication error',
      error: 'AUTH_ERROR'
    });
  }
};

export default authMiddleware; 