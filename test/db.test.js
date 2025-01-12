const mongoose = require('mongoose');
require('dotenv').config();

describe('MongoDB Connection', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should connect to MongoDB', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });
}); 