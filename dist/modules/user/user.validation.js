"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hardDelete = exports.updatePassword = exports.updateEmail = exports.updateBasicInfo = exports.restoreAccount = exports.freezeAccount = exports.logout = void 0;
const zod_1 = require("zod");
const token_security_1 = require("../../utils/security/token.security");
const mongoose_1 = require("mongoose");
const validation_middleware_1 = require("../../middleware/validation.middleware");
exports.logout = {
    body: zod_1.z.strictObject({
        flag: zod_1.z.enum(token_security_1.logoutEnum).default(token_security_1.logoutEnum.only)
    })
};
exports.freezeAccount = {
    params: zod_1.z.object({
        userId: zod_1.z.string().optional()
    }).optional().refine((data) => {
        return data?.userId ? mongoose_1.Types.ObjectId.isValid(data.userId) : true;
    }, { error: "invalid objectId format", path: ["userId"] })
};
exports.restoreAccount = {
    params: zod_1.z.object({
        userId: zod_1.z.string()
    }).refine((data) => {
        return mongoose_1.Types.ObjectId.isValid(data.userId);
    }, { error: "invalid objectId format", path: ["userId"] })
};
exports.updateBasicInfo = {
    body: zod_1.z.strictObject({
        firstName: validation_middleware_1.generalFields.firstName,
        lastName: validation_middleware_1.generalFields.lastName
    }).required()
};
exports.updateEmail = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email
    }).required()
};
exports.updatePassword = {
    body: zod_1.z.strictObject({
        password: validation_middleware_1.generalFields.password,
        confirmPassowrd: validation_middleware_1.generalFields.confirmPassword
    }).required()
};
exports.hardDelete = exports.restoreAccount;
