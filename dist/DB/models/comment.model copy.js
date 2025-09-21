"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModel = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = require("mongoose");
const commentSchema = new mongoose_2.Schema({
    content: { type: String, minLength: 2, maxLength: 500000, required: function () {
            return !this.attachments?.length;
        } },
    attachments: [String],
    likes: [{ type: mongoose_2.Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: mongoose_2.Schema.Types.ObjectId, ref: "User" }],
    createdBy: [{ type: mongoose_2.Schema.Types.ObjectId, ref: "User", required: true }],
    postId: [{ type: mongoose_2.Schema.Types.ObjectId, ref: "Post", required: true }],
    commentId: [{ type: mongoose_2.Schema.Types.ObjectId, ref: "Comment" }],
    freezedAt: Date,
    freezedBy: [{ type: mongoose_2.Schema.Types.ObjectId, ref: "User" }],
    restoredAt: Date,
    restoredBy: [{ type: mongoose_2.Schema.Types.ObjectId, ref: "User" }],
}, {
    timestamps: true,
    strictQuery: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
commentSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    next();
});
commentSchema.pre(["findOne", "find", "countDocuments"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    next();
});
commentSchema.virtual("reply", {
    localField: "_id",
    foreignField: "commentId",
    ref: "Comment",
    justOne: true
});
exports.CommentModel = mongoose_1.models.Post || (0, mongoose_1.model)("Comment", commentSchema);
