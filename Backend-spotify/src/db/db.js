const mongoose = require('mongoose');

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI) 
        console.log('Connected to Mumbai Database successfully ✅✅');
    } catch (error) {
        console.error('Error connecting to Mumbai Database:', error);
    }
}

module.exports = connectDB;