

import { ProviderEnum, UserModel } from './../../DB/models/User.model';

import { IConfirmEmailBodyInputsDTO, IForgotCodeInputsDTO, IGmail, ILoginBodyInputsDTO, IResetForgotCodeInputsDTO, ISignupBodyInputsDTO, IVerifyForgotCodeInputsDTO } from './auth.dto';

import type { Request,Response } from "express"
// import * as DBService from "../../DB/db.service"

import { createLoginCredentials } from '../../utils/security/token.security';
import { UserRepository } from '../../DB/repository/user.repository';
import { BadRequestException, ConflictException, NotFoundException } from '../../utils/response/error.response';
import { generateHash,compareHash } from '../../utils/security/hash.security';
import { emailEvent } from '../../utils/email/email.event';
import { generateNumberotp } from '../../utils/otp';
import { OAuth2Client,type TokenPayload } from 'google-auth-library';
import { successResponse } from '../../utils/response/success.response';
import { ILoginResponse } from './auth.entities';
class AuthenticationService {
    private userModel= new UserRepository(UserModel)
    constructor(){}

    private async verifyGmailAccount(idToken:string):Promise <TokenPayload>{
        const client = new OAuth2Client()
        const ticket= await client.verifyIdToken({
            idToken,
            audience:process.env.WEB_CLIENT_IDS?.split(",") || []
        })
        const payload =ticket.getPayload()
        if(!payload?.email_verified){
            throw new BadRequestException("Failed to verify this google account")

        }
        return payload
    }


    signupWithGmail=async(req:Request,res:Response):Promise<Response>=>{

        const {idToken}:IGmail=req.body
        const{ email,family_name,given_name,picture}= await this.verifyGmailAccount(idToken)

        const user= await this.userModel.findOne({
            filter:{
                email
            }
        })

        if(user){
            if(user.provider === ProviderEnum.google){
                return await this.loginWithGmail(req,res)
            }
            throw new ConflictException(`Emails exists with another provider : ${user.provider}`)
        }

        const [newUser]=(await this.userModel.create({
            data:[
                {
                    firstName:given_name as string,
                    lastName: family_name as string,
                    email:email as string,
                    profileImage: picture as string,
                    confirmedAt: new Date(),
                    provider: ProviderEnum.google
                }
            ]
        })) || []

        if(!newUser){
            throw new BadRequestException("Failed to signup with gmail. Please try again later")
        }

        const credentials = await createLoginCredentials(newUser)
         return successResponse<ILoginResponse>({res,statusCode:201,data: {credentials}})
    }

    loginWithGmail=async(req:Request,res:Response):Promise<Response>=>{

        const {idToken}:IGmail=req.body
        const{ email}= await this.verifyGmailAccount(idToken)

        const user= await this.userModel.findOne({
            filter:{
                email,
                provider:ProviderEnum.google
            }
        })

        if(!user){
            throw new NotFoundException("Account Not registered or registered with another provider")
        }


        const credentials = await createLoginCredentials(user)
         return successResponse<ILoginResponse>({res,data: {credentials}})
    }

    signup=async (req:Request,res:Response):Promise<Response> =>{

        
    let { username,email,password}: ISignupBodyInputsDTO=req.body
    
        const checkUserExists= await this.userModel.findOne({
            filter:{email},
            select:"email",
            options:{
                lean:true,
                
            }
        })
        if(checkUserExists){
            throw new ConflictException("Emails exists")
        }
        const otp= generateNumberotp()
        await this.userModel.createUser({
        data:[{username,email,password: await generateHash(password),confirmEmailOtp:await generateHash(String(otp))}],
       
    }) 
       
    emailEvent.emit("confirmEmail",{to:email,otp})
    return successResponse({res,statusCode:201})

    
}

confirmEmail=async (req:Request,res:Response):Promise<Response> =>{
    const {email,otp}:IConfirmEmailBodyInputsDTO=req.body
    const user= await this.userModel.findOne({
        filter:{
            email,
            confirmEmailOtp:{$exists:true},
            confirmedAt:{$exists:false}
        }
    })
    if(!user){
        throw new NotFoundException("Invalid account")
    }
    if(!(await compareHash(otp,user.confirmEmailOtp as string))){
        throw new ConflictException("Invalid confirmation code")
    }

    await this.userModel.updateOne({
        filter:{email},
        update:{
            confirmedAt: new Date(),
            $unset:{confirmEmailOtp:1}
        }
    })
    return successResponse({res})
}

login=async (req:Request,res:Response):Promise<Response> =>{
    const {email,password}:ILoginBodyInputsDTO=req.body
    const user = await this.userModel.findOne({
        filter:{email}
    })

    if(!user){
        throw new NotFoundException("Invalid login data")
    }
    if(!user.confirmedAt){
        throw new BadRequestException("Verify your account first")
    }
    if(!(await compareHash(password,user.password))){
        throw new NotFoundException("Invalid login data")
    }
    const credentials= await createLoginCredentials(user)
    return successResponse<ILoginResponse>({res,data: {credentials}})
}

sendForgotCode=async (req:Request,res:Response):Promise<Response> =>{
    const {email}:IForgotCodeInputsDTO=req.body
    const user = await this.userModel.findOne({
        filter:{
            email,
            provider: ProviderEnum.system,
            condirmedAt:{$exists:true}
        }
    })

    if(!user){
        throw new NotFoundException("Invalid account due to one of the following reasons: [not registered,invalid provider,account not confirmed}")
    }
   
    const otp= generateNumberotp()
    const result= await this.userModel.updateOne({
        filter:{email},
        update:{
            resetPasswordOtp: await generateHash(String(otp))
        }
    })
    if(!result.matchedCount){
        throw new BadRequestException("Failed to send the reset code. PLease try again later")
    }
    
    emailEvent.emit("resetPassord",{to:email,otp})
    
    return successResponse({res})
}

verifyForgotCode=async (req:Request,res:Response):Promise<Response> =>{
    const {email,otp}:IVerifyForgotCodeInputsDTO=req.body
    const user = await this.userModel.findOne({
        filter:{
            email,
            provider: ProviderEnum.system,
            resetPasswordOtp:{$exists:true}
        }
    })

    if(!user){
        throw new NotFoundException("Invalid account due to one of the following reasons: [not registered,invalid provider,account not confirmed, missing reset password Otp}")
    }
    if(!(await compareHash(otp, user.resetPasswordOtp as string))){
        throw new ConflictException("Invalid otp")
    }
   
    
    return successResponse({res})
}

resetForgotCode=async (req:Request,res:Response):Promise<Response> =>{
    const {email,otp,password}:IResetForgotCodeInputsDTO=req.body
    const user = await this.userModel.findOne({
        filter:{
            email,
            provider: ProviderEnum.system,
            resetPasswordOtp:{$exists:true}
        }
    })

    if(!user){
        throw new NotFoundException("Invalid account due to one of the following reasons: [not registered,invalid provider,account not confirmed, missing reset password Otp}")
    }
    if(!(await compareHash(otp, user.resetPasswordOtp as string))){
        throw new ConflictException("Invalid otp")
    }
   
    const result= await this.userModel.updateOne({
        filter:{email},
        update:{
            password: await generateHash(password),
            changeCredentialsTime: new Date(),
            $unset:{ resetPasswordOtp:1}
            
        }
    })
    if(!result.matchedCount){
        throw new BadRequestException("Failed to reset account password. PLease try again later")
    }
    
    return successResponse({res})
}


}
export default new AuthenticationService()