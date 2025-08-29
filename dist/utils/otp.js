"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNumberotp = void 0;
const generateNumberotp = () => {
    return Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
};
exports.generateNumberotp = generateNumberotp;
