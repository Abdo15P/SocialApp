"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendRequestRepository = void 0;
const comment_model_1 = require("./../models/comment.model");
const database_repository_1 = require("./database.repository");
const comment_repository_1 = require("./comment.repository");
class FriendRequestRepository extends database_repository_1.DatabaseRepository {
    model;
    commentModel = new comment_repository_1.CommentRepository(comment_model_1.CommentModel);
    constructor(model) {
        super(model);
        this.model = model;
    }
}
exports.FriendRequestRepository = FriendRequestRepository;
