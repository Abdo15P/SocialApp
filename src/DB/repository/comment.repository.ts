import {IComment as TDocument} from "../models/comment.model"
import { DatabaseRepository } from "./database.repository";
import { Model } from "mongoose";

export class CommentRepository extends DatabaseRepository<TDocument>{
    constructor(protected override readonly model:Model<TDocument>){
        super(model)
    }
}