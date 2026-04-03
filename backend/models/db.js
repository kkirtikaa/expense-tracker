const mongoose = require('mongoose');
const mongo_url = process.env.MONGO_URL;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connectDB(maxRetries = 5) {
    if (!mongo_url) {
        throw new Error('MONGO_URL is not set');
    }

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        try {
            await mongoose.connect(mongo_url, {
                serverSelectionTimeoutMS: 10000,
            });
            console.log('Database Connected');
            return;
        } catch (err) {
            console.log(`Error connecting to DB (attempt ${attempt}/${maxRetries})`);
            if (attempt === maxRetries) {
                throw err;
            }
            await sleep(2000 * attempt);
        }
    }
}

module.exports = connectDB;