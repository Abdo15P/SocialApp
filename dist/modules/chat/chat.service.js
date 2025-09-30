"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const error_response_1 = require("../../utils/response/error.response");
const success_response_1 = require("../../utils/response/success.response");
const repository_1 = require("../../DB/repository");
const models_1 = require("../../DB/models");
const mongoose_1 = require("mongoose");
const gateway_1 = require("../gateway");
const uuid_1 = require("uuid");
const s3_config_1 = require("../../utils/multer/s3.config");
class ChatService {
    chatModel = new repository_1.ChatRepository(models_1.ChatModel);
    userModel = new repository_1.UserRepository(models_1.UserModel);
    constructor() { }
    getChat = async (req, res) => {
        const { userId } = req.params;
        const { page, size } = req.query;
        const chat = await this.chatModel.findOneChat({
            filter: {
                participants: {
                    $all: [
                        req.user?._id,
                        mongoose_1.Types.ObjectId.createFromHexString(userId)
                    ]
                },
                group: { $exists: false }
            },
            options: {
                populate: [
                    {
                        path: "participants",
                        select: "firstName lastName email gender profilePicture"
                    }
                ]
            },
            page,
            size
        });
        if (!chat) {
            throw new error_response_1.BadRequestException("Failed to find matching chat instance");
        }
        return (0, success_response_1.successResponse)({ res, data: { chat } });
    };
    getChattingGroup = async (req, res) => {
        const { groupId } = req.params;
        const { page, size } = req.query;
        const chat = await this.chatModel.findOneChat({
            filter: {
                _id: mongoose_1.Types.ObjectId.createFromHexString(groupId),
                paticipants: { $in: req.user?._id },
                group: { $exists: true }
            },
            options: {
                populate: [
                    {
                        path: "messages.createdBy",
                        select: "firstName lastName email gender profilePicture"
                    }
                ]
            },
            page,
            size
        });
        if (!chat) {
            throw new error_response_1.BadRequestException("Failed to find matching chat instance");
        }
        return (0, success_response_1.successResponse)({ res, data: { chat } });
    };
    createChattingGroup = async (req, res) => {
        const { group, participants } = req.body;
        const dbParticipants = participants.map((participant) => {
            return mongoose_1.Types.ObjectId.createFromHexString(participant);
        });
        const users = await this.userModel.find({
            filter: {
                _id: { $in: dbParticipants },
                friends: { $in: req.user?._id }
            }
        });
        if (participants.length != users.length) {
            throw new error_response_1.NotFoundException("Some or all recipeints are invalid");
        }
        let group_image = undefined;
        const roomId = group.replaceAll(/\s+/g, "_" + "_" + (0, uuid_1.v4)());
        if (req.file) {
            group_image = await (0, s3_config_1.uploadFile)({
                file: req.file,
                path: `chat/${roomId}`
            });
        }
        dbParticipants.push(req.user?._id);
        const [chat] = (await this.chatModel.create({
            data: [
                {
                    createdBy: req.user?._id,
                    group,
                    roomId,
                    group_image: group_image,
                    message: [],
                    participants: dbParticipants
                }
            ]
        })) || [];
        if (!chat) {
            if (group_image) {
                await (0, s3_config_1.deleteFile)({ Key: group_image });
            }
            throw new error_response_1.BadRequestException("Failed to generate this group");
        }
        return (0, success_response_1.successResponse)({ res, statusCode: 201, data: { chat } });
    };
    sayHi = async ({ message, socket, callback, io }) => {
        try {
            console.log({ message });
            throw new error_response_1.BadRequestException("some error");
            callback ? callback("Hello BE to FE") : undefined;
        }
        catch (error) {
            return socket.emit("custom_error", error);
        }
    };
    sendMessage = async ({ content, sentTo, socket, io }) => {
        try {
            const createdBy = socket.credentials?.user._id;
            console.log({ content, sentTo, createdBy });
            const user = await this.userModel.findOne({
                filter: {
                    _id: mongoose_1.Types.ObjectId.createFromHexString(sentTo),
                    friends: { $in: createdBy }
                }
            });
            if (!user) {
                throw new error_response_1.NotFoundException("Invalid recipient friend");
            }
            const chat = await this.chatModel.findOneAndUpdate({
                filter: {
                    participants: {
                        $all: [
                            createdBy,
                            mongoose_1.Types.ObjectId.createFromHexString(sentTo)
                        ]
                    },
                    group: { $exists: false }
                },
                update: {
                    $addToSet: { messages: { content, createdBy } }
                }
            });
            if (!chat) {
                const [newChat] = await this.chatModel.create({
                    data: [
                        {
                            createdBy,
                            message: [{ content, createdBy }],
                            participants: [
                                createdBy,
                                mongoose_1.Types.ObjectId.createFromHexString(sentTo)
                            ]
                        }
                    ]
                }) || [];
                if (!newChat) {
                    throw new error_response_1.BadRequestException("Failed to create this chat instance");
                }
            }
            io?.to(gateway_1.connectedSockets.get(createdBy.toString())).emit("successMessage", { content });
            io?.to(gateway_1.connectedSockets.get(sentTo)).emit("newMessage", { content, from: socket.credentials?.user });
        }
        catch (error) {
            return socket.emit("custom_error", error);
        }
    };
    joinRoom = async ({ roomId, socket, io }) => {
        try {
            const chat = await this.chatModel.findOne({
                filter: {
                    roomId,
                    group: { $exists: true },
                    participants: { $in: socket.credentials?.user._id }
                }
            });
            if (!chat) {
                throw new error_response_1.NotFoundException("Failed to find matching room");
            }
            socket.join(chat.roomId);
        }
        catch (error) {
            return socket.emit("custom_error", error);
        }
    };
    sendGroupMessage = async ({ content, groupId, socket, io }) => {
        try {
            const createdBy = socket.credentials?.user._id;
            const chat = await this.chatModel.findOneAndUpdate({
                filter: {
                    _id: mongoose_1.Types.ObjectId.createFromHexString(groupId),
                    participants: { $in: createdBy },
                    group: { $exists: true }
                },
                update: {
                    $addToSet: { messages: { content, createdBy } }
                }
            });
            if (!chat) {
                throw new error_response_1.BadRequestException("Failed to find matching room");
            }
            io?.to(gateway_1.connectedSockets.get(createdBy.toString())).emit("successMessage", { content });
            socket?.to(chat.roomId).emit("newMessage", { content, from: socket.credentials?.user, groupId });
        }
        catch (error) {
            return socket.emit("custom_error", error);
        }
    };
}
exports.ChatService = ChatService;
