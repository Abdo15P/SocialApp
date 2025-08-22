"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const DBService = __importStar(require("../../DB/db.service"));
const User_model_1 = require("../../DB/models/User.model");
const error_response_1 = require("../../utils/response/error.response");
class AuthenticationService {
    constructor() { }
    signup = async (req, res) => {
        let { username, email, password } = req.body;
        if (await DBService.findOne({ model: User_model_1.UserModel, filter: { email } })) {
            throw new error_response_1.EmailExistsException("Email Exists");
        }
        const user = await DBService.create({ model: User_model_1.UserModel, data: [{ username, email, password }] });
        console.log(username, email, password);
        return res.status(201).json({ message: "Done", data: user });
    };
    login = (req, res) => {
        return res.json({ message: "Done" });
    };
}
exports.default = new AuthenticationService();
