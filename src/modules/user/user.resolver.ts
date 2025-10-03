
import { GenderEnum, HUserDocument } from "../../DB/models"

import { IUser, UserService } from "./user.service"
import { endpoint } from './user.authorization';
import { graphAuthorization } from "../../middleware/authentication.middleware";
import { IAUthGraph } from "../graphql/schema.interface.qgl";
import { graphValidation } from "../../middleware/validation.middleware";
import * as validators from './user.validation'
export class UserResolver{
    private userService:UserService= new UserService()
    constructor(){}

    welcome = async (parent: unknown, args:{name:string},context:IAUthGraph):Promise<string>=>{
                    await graphValidation<{name:string}>(validators.welcome,args)
                    await graphAuthorization(endpoint.welcome,context.user.role)
                    return this.userService.welcome(context.user)
                }

    allUsers= async (parent: unknown, args:{ gender:GenderEnum},context:IAUthGraph):Promise<HUserDocument[]>=>{
                    return await this.userService.allusers(args,context.user)
                }

    search =(parent: unknown, args:{email:string}):{message:string;statusCode:number;data:IUser}=>{
                    return this.userService.search(args)
                }

    addFollower=(parent: unknown, args:{friendId:number; myId:number}):IUser[]=>{
                    return this.userService.addFollower(args)

            }
}