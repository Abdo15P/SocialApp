import { HChatDocument } from "../../DB/models";
import { HUserDocument } from "../../DB/models/User.model";

export interface IProfileImageResponse{
    url:string
}

export interface IUserResponse {
    user:Partial<HUserDocument>,
    groups?:Partial<HChatDocument>[]

}