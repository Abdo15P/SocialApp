import { NextFunction,Request,Response } from "express"
import { HUserDocument, RoleEnum } from "../DB/models/User.model"
import { JwtPayload } from "jsonwebtoken"
import { BadRequestException, ForbiddenException } from "../utils/response/error.response"
import { decodeToken, TokenEnum } from "../utils/security/token.security"

export interface IAuthReq extends Request{
    user: HUserDocument
    decoded: JwtPayload
}
export const authentication=(tokenType:TokenEnum=TokenEnum.access)=>{
    return async (req:Request,res:Response,next:NextFunction)=>{
       
        if (!req.headers.authorization){
            throw new BadRequestException("validation error",{
                key: "headers",
                issues:[{path:"authorization",message:"missing authorization"}]
            })
        }
        const {decoded,user}=await decodeToken({
            authorization: req.headers.authorization,
            tokenType
        })
        req.user= user
        req.decoded=decoded
        next()
    }
}

export const authorization=(accessRoles:RoleEnum[]=[],tokenType:TokenEnum=TokenEnum.access)=>{
    return async (req:Request,res:Response,next:NextFunction)=>{
       
        if (!req.headers.authorization){
            throw new BadRequestException("validation error",{
                key: "headers",
                issues:[{path:"authorization",message:"missing authorization"}]
            })
        }
        const {decoded,user}=await decodeToken({
            authorization: req.headers.authorization,
            tokenType
        })

        if(!accessRoles.includes(user.role)){
            throw new ForbiddenException("Account not authorized")
        }

        req.user= user
        req.decoded=decoded
        next()
    }
}