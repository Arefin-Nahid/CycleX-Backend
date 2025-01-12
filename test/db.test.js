import { connect, connection } from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

describe('MongoDB Connection', () => {
  beforeAll(async () => {
    await connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await connection.close();
  });

  it('should connect to MongoDB', () => {
    expect(connection.readyState).toBe(1);
  });
}); 