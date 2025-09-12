"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likePost = exports.createPost = void 0;
const zod_1 = require("zod");
const post_model_1 = require("../../DB/models/post.model");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
exports.createPost = {
    body: zod_1.z.strictObject({
        content: zod_1.z.string().min(2).max(500000).optional(),
        attachments: zod_1.z.array(validation_middleware_1.generalFields.file(cloud_multer_1.fileValidation.image)).max(2).optional(),
        availability: zod_1.z.enum(post_model_1.AvailabilityEnum).default(post_model_1.AvailabilityEnum.public),
        allowComments: zod_1.z.enum(post_model_1.AllowCommentsEnum).default(post_model_1.AllowCommentsEnum.allow),
        tags: zod_1.z.array(validation_middleware_1.generalFields.id).max(10).optional()
    }).superRefine((data, ctx) => {
        if (!data.attachments?.length && !data.content) {
            ctx.addIssue({
                code: "custom",
                path: ["custom"],
                message: "Post must have content or attachments"
            });
        }
        if (data.tags?.length && data.tags.length !== [...new Set(data.tags)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["custom"],
                message: "Duplicate tagged users"
            });
        }
    })
};
exports.likePost = {
    params: zod_1.z.strictObject({
        postId: validation_middleware_1.generalFields.id
    }),
    query: zod_1.z.strictObject({
        action: zod_1.z.enum(post_model_1.LikeActionEnum).default(post_model_1.LikeActionEnum.like)
    })
};
