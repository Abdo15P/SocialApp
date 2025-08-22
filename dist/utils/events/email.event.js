"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailEvent = void 0;
const node_events_1 = require("node:events");
const send_email_1 = require("../../utils/email/send.email");
const verify_email_template_1 = require("../email/templates/verify.email.template");
exports.emailEvent = new node_events_1.EventEmitter();
exports.emailEvent.on("confirmEmail", async (data) => {
    await (0, send_email_1.sendEmail)({ to: data.to, subject: data.subject || "Confirm Email", html: (0, verify_email_template_1.verifyEmailTemplate)({ otp: data.otp }) }).catch(error => {
    });
});
exports.emailEvent.on("sendForgotPassowrd", async (data) => {
    await (0, send_email_1.sendEmail)({ to: data.to, subject: data.subject || "Forgot Email", html: (0, verify_email_template_1.verifyEmailTemplate)({ otp: data.otp, title: data.title }) }).catch(error => {
    });
});
