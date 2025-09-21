"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = require("../../DB/repository/user.repository");
const User_model_1 = require("../../DB/models/User.model");
const token_security_1 = require("../../utils/security/token.security");
const s3_config_1 = require("../../utils/multer/s3.config");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
const error_response_1 = require("../../utils/response/error.response");
const s3_events_1 = require("../../utils/multer/s3.events");
const success_response_1 = require("../../utils/response/success.response");
const repository_1 = require("../../DB/repository");
const models_1 = require("../../DB/models");
class UserService {
    userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    postModel = new repository_1.PostRepository(models_1.PostModel);
    friendRequestModel = new repository_1.FriendRequestRepository(models_1.FriendRequestModel);
    constructor() { }
    profileImage = async (req, res) => {
        const { ContentType, originalname } = req.body;
        const { url, key } = await (0, s3_config_1.createPreSignedUploadLink)({ ContentType, originalname, path: `users/${req.decoded?._id}` });
        const user = await this.userModel.findByIdAndUpdate({
            id: req.user?._id,
            update: {
                profileImage: key,
                tempProfileImage: req.user?.profileImage
            }
        });
        if (!user) {
            throw new error_response_1.BadRequestException("Failed to update user profile image");
        }
        s3_events_1.s3Event.emit("trackProfileImageUpload", {
            userId: req.user?._id,
            oldKey: req.user?.profileImage,
            key,
            expiresIn: 30000
        });
        return (0, success_response_1.successResponse)({ res, data: { url } });
    };
    profileCoverImage = async (req, res) => {
        const urls = await (0, s3_config_1.uploadFiles)({
            storageApproach: cloud_multer_1.StorageEnum.disk,
            files: req.files,
            path: `users/${req.decoded?._id}/cover`
        });
        const user = await this.userModel.findByIdAndUpdate({
            id: req.user?._id,
            update: {
                coverImages: urls
            }
        });
        if (!user) {
            throw new error_response_1.BadRequestException("Failed to update profile cover images");
        }
        if (req.user?.coverImages) {
            await (0, s3_config_1.deleteFiles)({ urls: req.user.coverImages });
        }
        return (0, success_response_1.successResponse)({ res, statusCode: 201, data: { user } });
    };
    profile = async (req, res) => {
        const profile = await this.userModel.findById({
            id: req.user?._id,
            options: {
                populate: [
                    {
                        path: "friends",
                        select: "firstName lastName email gender profilePicture"
                    }
                ]
            }
        });
        if (!profile) {
            throw new error_response_1.NotFoundException("failed to find user profile");
        }
        return (0, success_response_1.successResponse)({ res, data: { user: profile } });
    };
    dashboard = async (req, res) => {
        const results = await Promise.allSettled([
            this.userModel.find({ filter: {} }),
            this.postModel.find({ filter: {} })
        ]);
        return (0, success_response_1.successResponse)({ res, data: { results } });
    };
    changeRole = async (req, res) => {
        const { userId } = req.params;
        const { role } = req.body;
        const denyRoles = [role, User_model_1.RoleEnum.superAdmin];
        if (req.user?.role === User_model_1.RoleEnum.admin) {
            denyRoles.push(User_model_1.RoleEnum.admin);
        }
        const user = await this.userModel.findOneAndUpdate({
            filter: {
                _id: userId,
                role: { $nin: denyRoles }
            },
            update: {
                role
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Failed to find matching result");
        }
        return (0, success_response_1.successResponse)({ res, });
    };
    sendFriendRequest = async (req, res) => {
        const { userId } = req.params;
        const checkFriendRequestExists = await this.friendRequestModel.findOne({
            filter: {
                createdBy: { $in: [req.user?._id, userId] },
                sentTo: { $in: [req.user?._id, userId] }
            }
        });
        if (checkFriendRequestExists) {
            throw new error_response_1.ConflictException("Friend request already exists");
        }
        const user = await this.userModel.findOne({ filter: { _id: userId } });
        if (!user) {
            throw new error_response_1.NotFoundException("invalid recipient");
        }
        const [friendRequest] = (await this.friendRequestModel.create({
            data: [
                {
                    createdBy: req.user?._id,
                    sentTo: userId
                }
            ]
        })) || [];
        if (!friendRequest) {
            throw new error_response_1.BadRequestException("Something went wrong");
        }
        return (0, success_response_1.successResponse)({ res, statusCode: 201 });
    };
    acceptFriendRequest = async (req, res) => {
        const { requestId } = req.params;
        const friendRequest = await this.friendRequestModel.findOneAndUpdate({
            filter: {
                _id: requestId,
                sentTo: req.user?._id,
                acceptedAt: { $exists: false }
            },
            update: {
                accedptedAt: new Date()
            }
        });
        if (!friendRequest) {
            throw new error_response_1.NotFoundException("Failed to find matching result");
        }
        await Promise.all([
            await this.userModel.updateOne({
                filter: { _id: friendRequest.createdBy },
                update: {
                    $addToSet: { friends: friendRequest.sentTo }
                }
            }),
            await this.userModel.updateOne({
                filter: { _id: friendRequest.sentTo },
                update: {
                    $addToSet: { friends: friendRequest.createdBy }
                }
            })
        ]);
        return (0, success_response_1.successResponse)({ res, });
    };
    updateBasicInfo = async (req, res) => {
        const user = await this.userModel.findOneAndUpdate({
            filter: {
                _id: req.user?._id
            },
            update: req.body
        });
        if (!user) {
            throw new error_response_1.NotFoundException("user not found or failed to update this resource");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    updatePassword = async (req, res) => {
        const { password } = req.body;
        const user = await this.userModel.findOneAndUpdate({
            filter: {
                _id: req.user?._id
            },
            update: {
                password: password,
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("user not found or failed to update password");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    updateEmail = async (req, res) => {
        const { email } = req.body;
        const user = await this.userModel.findOneAndUpdate({
            filter: {
                _id: req.user?._id
            },
            update: {
                email: email,
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("user not found or failed to update email");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    freezeAccount = async (req, res) => {
        const { userId } = req.params || {};
        if (userId && req.user?.role !== User_model_1.RoleEnum.admin) {
            throw new error_response_1.ForbiddenException("Not authorized user");
        }
        const user = await this.userModel.updateOne({
            filter: {
                _id: userId || req.user?._id,
                freezedAt: { $exists: false }
            },
            update: {
                freezedAt: new Date(),
                freezedBy: req.user?._id,
                changeCredentialsTime: new Date(),
                $unset: {
                    restoredAt: 1,
                    restoredBy: 1
                }
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("user not found or failed to delete this resource");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    restoreAccount = async (req, res) => {
        const { userId } = req.params;
        const user = await this.userModel.updateOne({
            filter: {
                _id: userId,
                freezedBy: { $ne: userId }
            },
            update: {
                restoredAt: new Date(),
                restoredBy: req.user?._id,
                $unset: {
                    FreezedAt: 1,
                    FreezedBy: 1
                }
            }
        });
        if (!user.matchedCount) {
            throw new error_response_1.NotFoundException("user not found or failed to restore this resource");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    hardDeleteAccount = async (req, res) => {
        const { userId } = req.params;
        const user = await this.userModel.deleteOne({
            filter: {
                _id: userId,
                freezedAt: { $exists: true }
            },
        });
        if (!user.deletedCount) {
            throw new error_response_1.NotFoundException("user not found or failed to hard delete this resource");
        }
        await (0, s3_config_1.deleteFoldersByPrefix)({ path: `users/${userId}` });
        return (0, success_response_1.successResponse)({ res });
    };
    logout = async (req, res) => {
        const { flag } = req.body;
        let statusCode = 200;
        const update = {};
        switch (flag) {
            case token_security_1.logoutEnum.all:
                update.changeCredentialsTime = new Date();
                break;
            default:
                await (0, token_security_1.createRevokeToken)(req.decoded);
                statusCode = 201;
                break;
        }
        await this.userModel.updateOne({
            filter: { _id: req.decoded?._id },
            update
        });
        return res.status(statusCode).json({
            message: "Done"
        });
    };
    refreshToken = async (req, res) => {
        const credentials = await (0, token_security_1.createLoginCredentials)(req.user);
        await (0, token_security_1.createRevokeToken)(req.decoded);
        return (0, success_response_1.successResponse)({ res, statusCode: 201, data: { credentials } });
    };
}
exports.default = new UserService();
