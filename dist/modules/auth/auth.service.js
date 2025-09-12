"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_model_1 = require("./../../DB/models/User.model");
const token_security_1 = require("../../utils/security/token.security");
const error_response_1 = require("../../utils/response/error.response");
const hash_security_1 = require("../../utils/security/hash.security");
const email_event_1 = require("../../utils/email/email.event");
const otp_1 = require("../../utils/otp");
const google_auth_library_1 = require("google-auth-library");
const success_response_1 = require("../../utils/response/success.response");
const repository_1 = require("../../DB/repository");
class AuthenticationService {
    userModel = new repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    async verifyGmailAccount(idToken) {
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.WEB_CLIENT_IDS?.split(",") || []
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new error_response_1.BadRequestException("Failed to verify this google account");
        }
        return payload;
    }
    signupWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email, family_name, given_name, picture } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: {
                email
            }
        });
        if (user) {
            if (user.provider === User_model_1.ProviderEnum.google) {
                return await this.loginWithGmail(req, res);
            }
            throw new error_response_1.ConflictException(`Emails exists with another provider : ${user.provider}`);
        }
        const [newUser] = (await this.userModel.create({
            data: [
                {
                    firstName: given_name,
                    lastName: family_name,
                    email: email,
                    profileImage: picture,
                    confirmedAt: new Date(),
                    provider: User_model_1.ProviderEnum.google
                }
            ]
        })) || [];
        if (!newUser) {
            throw new error_response_1.BadRequestException("Failed to signup with gmail. Please try again later");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(newUser);
        return (0, success_response_1.successResponse)({ res, statusCode: 201, data: { credentials } });
    };
    loginWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_1.ProviderEnum.google
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Account Not registered or registered with another provider");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(user);
        return (0, success_response_1.successResponse)({ res, data: { credentials } });
    };
    signup = async (req, res) => {
        let { username, email, password } = req.body;
        const checkUserExists = await this.userModel.findOne({
            filter: { email },
            select: "email",
            options: {
                lean: true,
            }
        });
        if (checkUserExists) {
            throw new error_response_1.ConflictException("Emails exists");
        }
        const otp = (0, otp_1.generateNumberotp)();
        await this.userModel.createUser({
            data: [{ username, email, password, confirmEmailOtp: `${otp}` }],
        });
        email_event_1.emailEvent.emit("confirmEmail", { to: email, otp });
        return (0, success_response_1.successResponse)({ res, statusCode: 201 });
    };
    confirmEmail = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                confirmEmailOtp: { $exists: true },
                confirmedAt: { $exists: false }
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid account");
        }
        if (!(await (0, hash_security_1.compareHash)(otp, user.confirmEmailOtp))) {
            throw new error_response_1.ConflictException("Invalid confirmation code");
        }
        await this.userModel.updateOne({
            filter: { email },
            update: {
                confirmedAt: new Date(),
                $unset: { confirmEmailOtp: 1 }
            }
        });
        return (0, success_response_1.successResponse)({ res });
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const user = await this.userModel.findOne({
            filter: { email }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid login data");
        }
        if (!user.confirmedAt) {
            throw new error_response_1.BadRequestException("Verify your account first");
        }
        if (!(await (0, hash_security_1.compareHash)(password, user.password))) {
            throw new error_response_1.NotFoundException("Invalid login data");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(user);
        return (0, success_response_1.successResponse)({ res, data: { credentials } });
    };
    sendForgotCode = async (req, res) => {
        const { email } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_1.ProviderEnum.system,
                condirmedAt: { $exists: true }
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid account due to one of the following reasons: [not registered,invalid provider,account not confirmed}");
        }
        const otp = (0, otp_1.generateNumberotp)();
        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                resetPasswordOtp: await (0, hash_security_1.generateHash)(String(otp))
            }
        });
        if (!result.matchedCount) {
            throw new error_response_1.BadRequestException("Failed to send the reset code. PLease try again later");
        }
        email_event_1.emailEvent.emit("resetPassord", { to: email, otp });
        return (0, success_response_1.successResponse)({ res });
    };
    verifyForgotCode = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_1.ProviderEnum.system,
                resetPasswordOtp: { $exists: true }
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid account due to one of the following reasons: [not registered,invalid provider,account not confirmed, missing reset password Otp}");
        }
        if (!(await (0, hash_security_1.compareHash)(otp, user.resetPasswordOtp))) {
            throw new error_response_1.ConflictException("Invalid otp");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    resetForgotCode = async (req, res) => {
        const { email, otp, password } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_1.ProviderEnum.system,
                resetPasswordOtp: { $exists: true }
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid account due to one of the following reasons: [not registered,invalid provider,account not confirmed, missing reset password Otp}");
        }
        if (!(await (0, hash_security_1.compareHash)(otp, user.resetPasswordOtp))) {
            throw new error_response_1.ConflictException("Invalid otp");
        }
        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                password: await (0, hash_security_1.generateHash)(password),
                changeCredentialsTime: new Date(),
                $unset: { resetPasswordOtp: 1 }
            }
        });
        if (!result.matchedCount) {
            throw new error_response_1.BadRequestException("Failed to reset account password. PLease try again later");
        }
        return (0, success_response_1.successResponse)({ res });
    };
}
exports.default = new AuthenticationService();
