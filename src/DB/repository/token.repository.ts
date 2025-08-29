import {IToken as TDocument} from "../models/Token.model"
import { DatabaseRepository } from "./database.repository";
import { Model } from "mongoose";

export class TokenRepository extends DatabaseRepository<TDocument>{
    constructor(protected override readonly model:Model<TDocument>){
        super(model)
    }
}