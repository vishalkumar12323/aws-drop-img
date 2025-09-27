import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  try {
    await mongoose.connect(process.env.DOCDB_URL, {
      tls: true,
      tlsCAFile: "./rds-combined-ca-bundle.pem",
    });
    isConnected = true;
    console.log("connected to DocumentDB");
  } catch (error) {
    console.log("DB connection error: ", error);
    throw error;
  }
}
