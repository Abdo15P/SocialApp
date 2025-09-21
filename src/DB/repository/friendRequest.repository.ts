import { CommentModel } from './../models/comment.model';
import {IFriendRequest as TDocument} from "../models/friendRequest.model"
import { DatabaseRepository, Lean } from "./database.repository";
import { HydratedDocument, Model, PopulateOptions, ProjectionType, QueryOptions, RootFilterQuery } from "mongoose";
import { CommentRepository } from './comment.repository';

export class FriendRequestRepository extends DatabaseRepository<TDocument>{
    private commentModel= new CommentRepository(CommentModel)
    constructor(protected override readonly model:Model<TDocument>){
        super(model)
    }

    
}