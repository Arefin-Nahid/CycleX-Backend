import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

try {
  // Check if Firebase is already initialized
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        type: process.env.FIREBASE_TYPE, 
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), 
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID, 
        auth_uri: process.env.FIREBASE_AUTH_URI, 
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL, 
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL, // Add Realtime Database URL
    });
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  process.exit(1);
}

// Get Realtime Database reference
let db;
try {
  db = admin.database();
  console.log('✅ Firebase Realtime Database initialized successfully');
} catch (error) {
  console.warn('⚠️ Firebase Realtime Database not configured. Please set FIREBASE_DATABASE_URL in your .env file');
  console.warn('⚠️ Firebase features will be disabled until configured');
  db = null;
}

export default admin;
export { db };
