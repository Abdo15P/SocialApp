import mongoose, { ConnectOptions } from "mongoose";


class Database {

  constructor() {}

  public async connect(): Promise<void> {
    try {
      const uri = process.env.DB_URI;
      if (!uri) {
        throw new Error("DB_URI environment variable is not defined");
      }

      const options: ConnectOptions = {
        serverSelectionTimeoutMS: 30000,
      };

      await mongoose.connect(uri, options);
      
      console.log("Database connected successfully");
    } catch (error) {
      console.error("Failed to connect to database:", error);
      
    }
  }

}

export default new Database();

// Usage example
// import Database from "./database";

// const db = Database.getInstance();

// // Connect to database
// try {
  
//   console.log("Connection status:", db.getConnectionStatus());
// } catch (error) {
//   console.error("Connection failed");
// }

// // Later, when you need to disconnect
// // await db.disconnect();