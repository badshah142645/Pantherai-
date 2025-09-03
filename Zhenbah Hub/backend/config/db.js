// Mock database for demonstration - replace with actual database in production
const connectDB = async () => {
  try {
    console.log('Mock database connected (for demonstration)');
    // In production, replace this with actual database connection
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    // Don't exit in demo mode
    return false;
  }
};

module.exports = connectDB;