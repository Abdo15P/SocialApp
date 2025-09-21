"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = exports.postAvailability = void 0;
var post_service_1 = require("./post.service");
Object.defineProperty(exports, "postAvailability", { enumerable: true, get: function () { return post_service_1.postAvailability; } });
var post_controller_1 = require("./post.controller");
Object.defineProperty(exports, "router", { enumerable: true, get: function () { return __importDefault(post_controller_1).default; } });
