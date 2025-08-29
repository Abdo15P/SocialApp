"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetForgotPasswordCode = exports.verifyForgotPasswordCode = exports.sendForgotPasswordCode = exports.signupWithGmail = exports.confirmEmail = exports.signup = exports.login = void 0;
const zod_1 = require("zod");
const validation_middleware_1 = require("../../middleware/validation.middleware");
exports.login = {
    body: zod_1.z.object({
        email: validation_middleware_1.generalFields.email,
        password: validation_middleware_1.generalFields.password,
    })
};
exports.signup = {
    body: exports.login.body.extend({
        username: validation_middleware_1.generalFields.username,
        confirmPassword: validation_middleware_1.generalFields.confirmPassword,
    }).superRefine((data, ctx) => {
        if (data.confirmPassword !== data.password) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmPassowrd"],
                message: "Password and confirm password mismatch"
            });
        }
    })
};
exports.confirmEmail = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email,
        otp: validation_middleware_1.generalFields.otp,
    })
};
exports.signupWithGmail = {
    body: zod_1.z.strictObject({
        idToken: zod_1.z.string()
    })
};
exports.sendForgotPasswordCode = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email
    })
};
exports.verifyForgotPasswordCode = {
    body: exports.sendForgotPasswordCode.body.extend({
        otp: validation_middleware_1.generalFields.otp,
    })
};
exports.resetForgotPasswordCode = {
    body: exports.verifyForgotPasswordCode.body.extend({
        otp: validation_middleware_1.generalFields.otp,
        password: validation_middleware_1.generalFields.password,
        confirmPassword: validation_middleware_1.generalFields.confirmPassword
    }).refine((data) => {
        return data.password === data.confirmPassword;
    }, { message: "password mismatch with confirm-password", path: ['confirmPassword'] })
};
