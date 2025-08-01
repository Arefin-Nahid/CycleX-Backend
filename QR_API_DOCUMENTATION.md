# CycleX QR Code API Documentation

## Overview
This document describes the backend API endpoints that support the QR code scanning functionality in the CycleX app.

## Base URL
```
https://your-backend-domain.com/api
```

## Authentication
All protected endpoints require Firebase authentication. Include the Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase_id_token>
```

---

## QR Code Endpoints

### 1. Generate QR Data for Cycle
**Endpoint:** `GET /qr/generate/:cycleId`  
**Authentication:** Required  
**Description:** Generates QR code data for a specific cycle (for cycle owners)

**Parameters:**
- `cycleId` (path): MongoDB ObjectId of the cycle

**Response:**
```json
{
  "message": "QR data generated successfully",
  "qrData": {
    "cycleId": "507f1f77bcf86cd799439011",
    "brand": "Giant",
    "model": "Escape 3",
    "hourlyRate": 5.00,
    "location": "KUET Campus",
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "qrString": "{\"cycleId\":\"507f1f77bcf86cd799439011\",\"brand\":\"Giant\",\"model\":\"Escape 3\",\"hourlyRate\":5.00,\"location\":\"KUET Campus\",\"timestamp\":\"2024-01-15T10:30:00.000Z\"}"
}
```

**Error Responses:**
- `400`: Invalid cycle ID format
- `403`: Not authorized (not the cycle owner)
- `404`: Cycle not found
- `500`: Server error

---

### 2. Validate QR Data
**Endpoint:** `POST /qr/validate`  
**Authentication:** Required  
**Description:** Validates QR code data before processing rental

**Request Body:**
```json
{
  "qrData": "{\"cycleId\":\"507f1f77bcf86cd799439011\",\"brand\":\"Giant\",\"model\":\"Escape 3\",\"hourlyRate\":5.00,\"location\":\"KUET Campus\",\"timestamp\":\"2024-01-15T10:30:00.000Z\"}"
}
```

**Response:**
```json
{
  "message": "QR data is valid",
  "isValid": true,
  "cycle": {
    "_id": "507f1f77bcf86cd799439011",
    "brand": "Giant",
    "model": "Escape 3",
    "condition": "Good",
    "hourlyRate": 5.00,
    "location": "KUET Campus",
    "isRented": false,
    "isActive": true
  }
}
```

**Error Responses:**
- `400`: Missing QR data, invalid format, cycle unavailable, or cycle inactive
- `404`: Cycle not found
- `500`: Server error

---

### 3. Get QR Statistics
**Endpoint:** `GET /qr/stats`  
**Authentication:** Required  
**Description:** Get QR code statistics for cycle owner

**Response:**
```json
{
  "message": "QR statistics retrieved successfully",
  "stats": {
    "totalCycles": 5,
    "activeCycles": 4,
    "availableCycles": 3,
    "rentedCycles": 1
  }
}
```

---

## Cycle Endpoints (Enhanced for QR)

### 4. Get Cycle by ID (Enhanced)
**Endpoint:** `GET /cycles/:id`  
**Authentication:** Not required  
**Description:** Get cycle details by ID (enhanced for QR scanning)

**Parameters:**
- `id` (path): MongoDB ObjectId of the cycle

**Response:**
```json
{
  "message": "Cycle found successfully",
  "cycle": {
    "_id": "507f1f77bcf86cd799439011",
    "owner": "firebase_uid_here",
    "brand": "Giant",
    "model": "Escape 3",
    "condition": "Good",
    "hourlyRate": 5.00,
    "description": "Well-maintained mountain bike",
    "location": "KUET Campus",
    "isRented": false,
    "isActive": true,
    "coordinates": {
      "latitude": 22.8964,
      "longitude": 89.5024
    },
    "images": ["image_url_1", "image_url_2"],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Invalid ID format, cycle unavailable, or cycle inactive
- `404`: Cycle not found
- `500`: Server error

---

### 5. Rent Cycle by QR Code
**Endpoint:** `POST /cycles/rent-by-qr`  
**Authentication:** Required  
**Description:** Rent a cycle using QR code data

**Request Body:**
```json
{
  "cycleId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "message": "Cycle rented successfully via QR code",
  "rental": {
    "_id": "507f1f77bcf86cd799439012",
    "cycle": {
      "_id": "507f1f77bcf86cd799439011",
      "brand": "Giant",
      "model": "Escape 3",
      "condition": "Good",
      "hourlyRate": 5.00,
      "location": "KUET Campus"
    },
    "renter": "firebase_uid_here",
    "owner": "firebase_uid_owner",
    "startTime": "2024-01-15T10:30:00.000Z",
    "status": "active",
    "duration": 0,
    "totalCost": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "cycle": {
    "_id": "507f1f77bcf86cd799439011",
    "brand": "Giant",
    "model": "Escape 3",
    "condition": "Good",
    "hourlyRate": 5.00,
    "location": "KUET Campus",
    "isRented": true,
    "isActive": true
  }
}
```

**Error Responses:**
- `400`: Missing cycle ID, invalid ID format, cycle unavailable, cycle inactive, owner rental not allowed, or active rental exists
- `404`: Cycle not found
- `500`: Server error

---

## Rental Endpoints (Enhanced)

### 6. Rent Cycle (Enhanced)
**Endpoint:** `POST /rentals`  
**Authentication:** Required  
**Description:** Rent a cycle (enhanced with better validation)

**Request Body:**
```json
{
  "cycleId": "507f1f77bcf86cd799439011"
}
```

**Response:** Same as "Rent Cycle by QR Code" endpoint

---

## Error Codes Reference

| Error Code | Description |
|------------|-------------|
| `MISSING_CYCLE_ID` | Cycle ID is required in request |
| `INVALID_ID_FORMAT` | Cycle ID format is invalid (must be 24 characters) |
| `CYCLE_NOT_FOUND` | Cycle with specified ID doesn't exist |
| `CYCLE_UNAVAILABLE` | Cycle is already rented |
| `CYCLE_INACTIVE` | Cycle is not active for rental |
| `OWNER_RENTAL_NOT_ALLOWED` | User cannot rent their own cycle |
| `ACTIVE_RENTAL_EXISTS` | User already has an active rental |
| `MISSING_QR_DATA` | QR data is required in request |
| `INVALID_QR_FORMAT` | QR data format is invalid |
| `FORBIDDEN` | User not authorized for this action |

---

## Testing QR Functionality

### 1. Generate Test QR Codes
Use any online QR code generator with these test data:

**Test Cycle 1:**
```json
{
  "cycleId": "507f1f77bcf86cd799439011",
  "brand": "Giant",
  "model": "Escape 3",
  "hourlyRate": 5.00,
  "location": "KUET Campus",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Test Cycle 2:**
```json
{
  "cycleId": "507f1f77bcf86cd799439012",
  "brand": "Trek",
  "model": "FX 2",
  "hourlyRate": 6.00,
  "location": "KUET Library",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Test Flow
1. Generate QR codes with the test data above
2. Open the CycleX app
3. Go to Renter Dashboard
4. Tap "Scan QR" button
5. Point camera at the generated QR code
6. Verify cycle details are displayed
7. Confirm rental
8. Check that rental appears in active rentals

---

## Security Considerations

1. **Authentication**: All sensitive operations require Firebase authentication
2. **Authorization**: Users can only access their own data and authorized operations
3. **Input Validation**: All inputs are validated for format and content
4. **Error Handling**: Comprehensive error handling prevents information leakage
5. **Rate Limiting**: Consider implementing rate limiting for production use

---

## Deployment Notes

1. Ensure MongoDB connection string is properly configured
2. Set up Firebase Admin SDK credentials
3. Configure CORS for your frontend domain
4. Set up environment variables for production
5. Test all endpoints with proper authentication

---

## Support

For technical support or questions about the QR API:
- Email: nahid7ar@gmail.com
- Phone: +880-1727-892717 