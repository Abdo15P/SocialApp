"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
class Database {
    constructor() { }
    async connect() {
        try {
            const uri = process.env.DB_URI;
            if (!uri) {
                throw new Error("DB_URI environment variable is not defined");
            }
            const options = {
                serverSelectionTimeoutMS: 30000,
            };
            await mongoose_1.default.connect(uri, options);
            console.log("Database connected successfully");
        }
        catch (error) {
            console.error("Failed to connect to database:", error);
        }
    }
}
exports.default = new Database();
