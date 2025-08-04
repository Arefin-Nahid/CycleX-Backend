# CycleX Backend API

A robust Node.js/Express.js backend API for the CycleX cycle sharing application, providing comprehensive functionality for cycle rental management, user authentication, payment processing, and QR code operations.

## 🚀 Features

- **User Management**: Registration, authentication, and profile management
- **Cycle Management**: Add, update, and manage cycles for owners
- **Rental System**: Complete rental lifecycle management
- **Payment Integration**: SSL Commerz payment gateway integration
- **QR Code Operations**: QR code generation and scanning functionality
- **Real-time Tracking**: Location-based services and tracking
- **Firebase Integration**: Authentication and real-time database
- **MongoDB Database**: Scalable data storage with Mongoose ODM

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- Firebase project setup
- SSL Commerz merchant account (for payments)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # MongoDB Configuration
   MONGODB_URI=your_mongodb_connection_string
   
   # Firebase Configuration
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_PRIVATE_KEY=your_firebase_private_key
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   
   # SSL Commerz Configuration
   SSL_STORE_ID=your_ssl_store_id
   SSL_STORE_PASSWORD=your_ssl_store_password
   SSL_IS_SANDBOX=true
   
   # JWT Secret
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📁 Project Structure

```
backend/
├── app.js                 # Main application file
├── server.js             # Server entry point
├── package.json          # Dependencies and scripts
├── config/
│   ├── db.js            # Database configuration
│   └── firebase.js      # Firebase configuration
├── controllers/
│   ├── userController.js
│   ├── cycleController.js
│   ├── rentalController.js
│   ├── paymentController.js
│   ├── qrController.js
│   ├── ownerController.js
│   ├── renterController.js
│   └── sslCommerzController.js
├── middleware/
│   ├── auth.js          # Authentication middleware
│   └── authMiddleware.js
├── models/
│   ├── User.js          # User model
│   ├── Cycle.js         # Cycle model
│   ├── Rental.js        # Rental model
│   ├── Payment.js       # Payment model
│   └── index.js         # Model exports
├── routes/
│   ├── userRoutes.js
│   ├── cycleRoutes.js
│   ├── rentalRoutes.js
│   ├── qrRoutes.js
│   ├── ownerRoutes.js
│   ├── renterRoutes.js
│   └── sslRoutes.js
└── public/
    ├── payment-success.html
    └── payment-failed.html
```

## 🔧 API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Cycle Management
- `POST /api/owner/cycles` - Add new cycle
- `GET /api/owner/cycles` - Get owner's cycles
- `PUT /api/owner/cycles/:id` - Update cycle
- `DELETE /api/owner/cycles/:id` - Delete cycle

### Rental Operations
- `POST /api/rentals/start` - Start rental
- `POST /api/rentals/end` - End rental
- `GET /api/rentals/history` - Get rental history
- `GET /api/rentals/active` - Get active rentals

### QR Code Operations
- `POST /api/qr/generate` - Generate QR code
- `POST /api/qr/scan` - Scan QR code
- `GET /api/qr/validate/:code` - Validate QR code

### Payment Processing
- `POST /api/payment/initiate` - Initiate payment
- `POST /api/payment/verify` - Verify payment
- `GET /api/payment/history` - Payment history

## 🚀 Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
npm run lint       # Run ESLint
npm run debug      # Start server in debug mode
```

## 🔒 Security Features

- JWT-based authentication
- Firebase authentication integration
- CORS configuration
- Input validation and sanitization
- Secure payment processing
- Environment variable protection

## 📊 Database Models

### User Model
- Basic user information
- Authentication details
- Role-based access (owner/renter)
- Profile data

### Cycle Model
- Cycle details and specifications
- Location tracking
- Availability status
- Owner information

### Rental Model
- Rental start/end times
- User and cycle references
- Payment information
- Status tracking

### Payment Model
- Payment transaction details
- SSL Commerz integration
- Payment status tracking

## 🌐 Deployment

### Vercel Deployment
The project includes `vercel.json` for easy deployment to Vercel:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

### Environment Variables for Production
Ensure all required environment variables are set in your deployment platform.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Email: nahid7ar@gmail.com
- Phone: +880-1727-892717

## 📄 License

This project is licensed under the ISC License.

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - User authentication and management
  - Cycle rental system
  - Payment integration
  - QR code operations
  - Real-time tracking capabilities 