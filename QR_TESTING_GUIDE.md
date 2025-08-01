# QR Code Testing Guide

## 🎯 Overview

This guide will help you test the QR code functionality in your CycleX app. The issue you're experiencing (nothing shows after scanning) is likely due to either:
1. Invalid QR code format
2. Backend API issues
3. Missing cycle data in the database

## 🔧 Backend Setup

### 1. **Ensure Backend is Running**
Make sure your backend is deployed and accessible at: `https://cycle-x-backend.vercel.app/api`

### 2. **Verify API Endpoints**
The following endpoints should be available:
- `GET /api/qr/code/:cycleId` - Get QR code data
- `GET /api/cycles/:id` - Get cycle details
- `POST /api/cycles/rent-by-qr` - Rent cycle via QR
- `POST /api/qr/validate` - Validate QR data

## 🧪 Testing Steps

### Step 1: Create Test Data

First, you need to create a test cycle in your database. You can do this through your app or directly in MongoDB.

**Example Cycle Document:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "owner": "your_firebase_uid",
  "brand": "Giant",
  "model": "Escape 3",
  "condition": "Good",
  "hourlyRate": 5.00,
  "description": "Well-maintained mountain bike",
  "location": "KUET Campus",
  "isRented": false,
  "isActive": true,
  "images": ["https://example.com/bike1.jpg"],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Step 2: Generate QR Code

**Option A: Using the API**
```bash
curl -X GET "https://cycle-x-backend.vercel.app/api/qr/code/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Option B: Manual QR Generation**
Use any online QR code generator with this data:
```
507f1f77bcf86cd799439011
```

### Step 3: Test Backend APIs

Run the test script:
```bash
cd backend
node test_qr_simple.js
```

**Before running, update the script:**
1. Replace `YOUR_FIREBASE_ID_TOKEN` with a real token
2. Replace `TEST_CYCLE_ID` with a real cycle ID from your database

### Step 4: Test Flutter App

1. **Open your Flutter app**
2. **Navigate to RenterDashboard**
3. **Tap "Scan QR"**
4. **Scan the generated QR code**
5. **Check the console/logs for any errors**

## 🔍 Debugging

### Check Flutter Console
Look for these error messages:
- `CYCLE_NOT_FOUND` - Cycle doesn't exist in database
- `CYCLE_UNAVAILABLE` - Cycle is already rented
- `CYCLE_INACTIVE` - Cycle is not active
- `INVALID_ID_FORMAT` - QR code format is wrong
- `Network error` - Backend connectivity issue

### Check Backend Logs
Monitor your backend logs for:
- Authentication errors
- Database connection issues
- API endpoint errors

### Common Issues & Solutions

#### Issue 1: "Nothing shows after scanning"
**Possible Causes:**
- QR code contains invalid data
- Backend API is not responding
- Authentication token is invalid

**Solutions:**
1. Verify QR code contains only the cycle ID
2. Test backend API directly
3. Check authentication in Flutter app

#### Issue 2: "Cycle not found"
**Possible Causes:**
- Cycle ID doesn't exist in database
- QR code format is incorrect

**Solutions:**
1. Verify cycle exists in database
2. Check QR code format
3. Use correct cycle ID

#### Issue 3: "Network error"
**Possible Causes:**
- Backend is down
- Internet connection issue
- Wrong API URL

**Solutions:**
1. Check backend status
2. Verify internet connection
3. Check API URL in Flutter app

## 📱 QR Code Format

### Simple Format (Recommended)
Just the cycle ID:
```
507f1f77bcf86cd799439011
```

### JSON Format (Advanced)
```json
{
  "cycleId": "507f1f77bcf86cd799439011",
  "brand": "Giant",
  "model": "Escape 3",
  "hourlyRate": 5.00,
  "location": "KUET Campus"
}
```

## 🚀 Quick Test

### 1. Create Test QR Code
Generate a QR code with this text:
```
507f1f77bcf86cd799439011
```

### 2. Add Test Cycle to Database
```javascript
// Add this to your MongoDB database
db.cycles.insertOne({
  _id: ObjectId("507f1f77bcf86cd799439011"),
  owner: "your_firebase_uid",
  brand: "Test Bike",
  model: "Test Model",
  condition: "Good",
  hourlyRate: 5.00,
  description: "Test cycle for QR scanning",
  location: "Test Location",
  isRented: false,
  isActive: true,
  images: [],
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 3. Test the Flow
1. Scan the QR code
2. Should navigate to RentCycle screen
3. Should show cycle details
4. Should allow starting rental

## 📞 Support

If you're still having issues:

1. **Check the Flutter console** for detailed error messages
2. **Test the backend APIs** directly using the test script
3. **Verify your database** has the correct cycle data
4. **Check authentication** is working properly

## 🎯 Success Criteria

The QR functionality is working correctly when:
- ✅ QR code scans successfully
- ✅ Navigates to RentCycle screen
- ✅ Shows cycle details
- ✅ Allows starting rental
- ✅ Creates rental in database
- ✅ Navigates to RentInProgress screen

---

**Need Help?** Check the console logs and backend API responses for specific error messages. 