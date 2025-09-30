"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postService = exports.postAvailability = void 0;
const User_model_1 = require("./../../DB/models/User.model");
const success_response_1 = require("../../utils/response/success.response");
const repository_1 = require("../../DB/repository");
const post_model_1 = require("../../DB/models/post.model");
const error_response_1 = require("../../utils/response/error.response");
const s3_config_1 = require("../../utils/multer/s3.config");
const uuid_1 = require("uuid");
const mongoose_1 = require("mongoose");
const models_1 = require("../../DB/models");
const gateway_1 = require("../gateway");
const postAvailability = (req) => {
    return [
        { availability: post_model_1.AvailabilityEnum.public },
        { availability: post_model_1.AvailabilityEnum.onlyMe, createdBy: req.user?._id },
        {
            availability: post_model_1.AvailabilityEnum.friends,
            createdBy: req.user?._id
        },
        {
            availability: { $ne: post_model_1.AvailabilityEnum.onlyMe },
            tags: { $in: req.user?._id }
        }
    ];
};
exports.postAvailability = postAvailability;
class PostService {
    UserModel = new repository_1.UserRepository(User_model_1.UserModel);
    PostModel = new repository_1.PostRepository(post_model_1.PostModel);
    commentModel = new repository_1.CommentRepository(models_1.CommentModel);
    constructor() { }
    createPost = async (req, res) => {
        if (req.body.tags?.length && (await this.UserModel.find({ filter: { _id: { $in: req.body.tags, $ne: req.user?._id } } })).length !== req.body.tags.length) {
            throw new error_response_1.NotFoundException("Some of the mentioned users do not exist");
        }
        let attachments = [];
        let assetsFolderId = (0, uuid_1.v4)();
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${req.user?._id}/post/${assetsFolderId}`
            });
        }
        const [post] = (await this.PostModel.create({
            data: [
                {
                    ...req.body,
                    attachments,
                    assetsFolderId,
                    createdBy: req.user?._id
                }
            ]
        })) || [];
        if (!post) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("Failed to create this post");
        }
        return (0, success_response_1.successResponse)({ res, statusCode: 201 });
    };
    updatePost = async (req, res) => {
        const { postId } = req.params;
        const post = await this.PostModel.findOne({
            filter: {
                _id: postId,
                createdBy: req.user?._id
            }
        });
        if (!post) {
            throw new error_response_1.NotFoundException("Failed to find matching result");
        }
        if (req.body.tags?.length && (await this.UserModel.find({ filter: { _id: { $in: req.body.tags, $ne: req.user?._id } } })).length !== req.body.tags.length) {
            throw new error_response_1.NotFoundException("Some of the mentioned users do not exist");
        }
        let attachments = [];
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${post.createdBy}/post/${post.assetsFolderId}`
            });
        }
        const updatedPost = await this.PostModel.updateOne({
            filter: { _id: post._id },
            update: [{
                    $set: {
                        content: req.body.content,
                        allowComments: req.body.allowComments || post.allowComments,
                        availability: req.body.availability || post.availability,
                        attachments: {
                            $setUnion: [
                                {
                                    $setDifference: [
                                        "attachments",
                                        req.body.removedAttachments || []
                                    ]
                                },
                                attachments
                            ]
                        },
                        tags: {
                            $setUnion: [
                                {
                                    $setDifference: [
                                        "tags",
                                        (req.body.removedTags || []).map((tag) => {
                                            return mongoose_1.Types.ObjectId.createFromHexString(tag);
                                        })
                                    ]
                                },
                                (req.body.tags || []).map((tag) => {
                                    return mongoose_1.Types.ObjectId.createFromHexString(tag);
                                })
                            ]
                        }
                    }
                },]
        });
        if (!updatedPost.matchedCount) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("Failed to create this post");
        }
        else {
            if (req.body.removedAttachments?.length) {
                await (0, s3_config_1.deleteFiles)({ urls: req.body.removedAttachments });
            }
        }
        return (0, success_response_1.successResponse)({ res });
    };
    likePost = async (req, res) => {
        const { postId } = req.params;
        const { action } = req.query;
        let update = { $addToSet: { likes: req.user?._id } };
        if (action === post_model_1.LikeActionEnum.unlike) {
            update = { $pull: { likes: req.user?._id } };
        }
        const post = await this.PostModel.findOneAndUpdate({
            filter: {
                _id: postId,
                $or: (0, exports.postAvailability)(req)
            },
            update
        });
        if (!post) {
            throw new error_response_1.NotFoundException("Invalid postId or post does not exist");
        }
        if (action !== post_model_1.LikeActionEnum.unlike) {
            (0, gateway_1.getIo)().to(gateway_1.connectedSockets.get(post.createdBy.toString()))
                .emit("likePost", { postId, userId: req.user?._id });
        }
        return (0, success_response_1.successResponse)({ res });
    };
    postList = async (req, res) => {
        let { page, size } = req.query;
        const posts = await this.PostModel.paginate({
            filter: {
                $or: (0, exports.postAvailability)(req)
            },
            options: { populate: [{
                        path: "comments",
                        match: {
                            commentId: { $exists: false },
                            freezedAt: { $exists: false }
                        },
                        populate: [{
                                path: "reply",
                                match: {
                                    commentId: { $exists: false },
                                    freezedAt: { $exists: false }
                                }
                            }]
                    }] },
            page,
            size
        });
        return (0, success_response_1.successResponse)({ res, data: { posts } });
    };
}
exports.postService = new PostService();
