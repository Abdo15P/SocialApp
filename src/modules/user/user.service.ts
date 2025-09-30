
import {Request,Response} from 'express'
import { UserRepository } from '../../DB/repository/user.repository'
import { HUserDocument, IUser, RoleEnum, UserModel } from '../../DB/models/User.model'
import { IFreezeAccountDto, IHardDeleteAccountDto, ILogoutDto, IRestoreAccountDto } from './user.dto'
import {  UpdateQuery,Types } from 'mongoose'
import { createLoginCredentials, createRevokeToken, logoutEnum } from '../../utils/security/token.security'

import { JwtPayload } from 'jsonwebtoken'
import { createPreSignedUploadLink, deleteFiles, deleteFoldersByPrefix, uploadFiles } from '../../utils/multer/s3.config'
import { StorageEnum } from '../../utils/multer/cloud.multer'
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException, UnauthorizedException } from '../../utils/response/error.response'
import { s3Event } from '../../utils/multer/s3.events'
import { successResponse } from '../../utils/response/success.response'
import { IProfileImageResponse, IUserResponse } from './user.entities'
import { ILoginResponse } from '../auth/auth.entities'
import { ChatRepository, FriendRequestRepository, PostRepository } from '../../DB/repository'
import { ChatModel, FriendRequestModel, PostModel } from '../../DB/models'



class UserService {
    private userModel:UserRepository= new UserRepository(UserModel)
    private chatModel:ChatRepository= new ChatRepository(ChatModel)
    private postModel:PostRepository= new PostRepository(PostModel)
    private friendRequestModel= new FriendRequestRepository(FriendRequestModel)
    
    constructor (){}

   profileImage=async (req:Request,res:Response):Promise<Response>=>{
   
  

    const {ContentType, originalname}:{ContentType:string,originalname:string}=req.body
    const {url,key}=await createPreSignedUploadLink({ContentType,originalname,path:`users/${req.decoded?._id}`})
    
    
    const user= await this.userModel.findByIdAndUpdate({
        id: req.user?._id as Types.ObjectId,
        update:{
            profileImage:key,
            tempProfileImage:req.user?.profileImage
        }
    })

    if(!user){
        throw new BadRequestException("Failed to update user profile image")
    }

    s3Event.emit("trackProfileImageUpload",{
        userId:req.user?._id,
        oldKey:req.user?.profileImage,
        key,
        expiresIn:30000
    })
    return successResponse<IProfileImageResponse>({res,data:{url}})
    }

       profileCoverImage=async (req:Request,res:Response):Promise<Response>=>{
   
    const urls= await uploadFiles({
        storageApproach:StorageEnum.disk,
        files:req.files as Express.Multer.File[],
        path: `users/${req.decoded?._id}/cover`
    })
        
    const user = await this.userModel.findByIdAndUpdate({
        id: req.user?._id as Types.ObjectId,
        update:{
            coverImages:urls
        }

    })
    if(!user){
        throw new BadRequestException("Failed to update profile cover images")
    }
    if(req.user?.coverImages){
        await deleteFiles({urls: req.user.coverImages})
    }
        return successResponse<IUserResponse>({res,statusCode:201,data:{user}})
    }

    profile=async (req:Request,res:Response):Promise<Response>=>{
        const user= await this.userModel.findById({
            id:req.user?._id as Types.ObjectId,
            options:{
                populate:[
                    {
                        path:"friends",
                        select:"firstName lastName email gender profilePicture"
                    }
                ]
            }
        })

        if(!user){
            throw new NotFoundException("failed to find user profile")
        }
        const groups= await this.chatModel.find({
            filter:{
                participants:{$in: req.user?._id as Types.ObjectId},
                group:{$exists: true}
            }
        })
        return successResponse<IUserResponse>({res,data:{user,groups}})
    }

    dashboard=async (req:Request,res:Response):Promise<Response>=>{
        
        const results= await Promise.allSettled([
            this.userModel.find({filter:{}}),
            this.postModel.find({filter:{}})
        ])
        return successResponse({res,data:{results}})
    }

    changeRole=async (req:Request,res:Response):Promise<Response>=>{
        const {userId}= req.params as unknown as {userId: Types.ObjectId}
        const {role}:{role:RoleEnum}=req.body
        const denyRoles:RoleEnum[]=[role, RoleEnum.superAdmin]
        if(req.user?.role===RoleEnum.admin){
            denyRoles.push(RoleEnum.admin)
        }
        const user= await this.userModel.findOneAndUpdate({
            filter:{
                _id:userId as Types.ObjectId,
                role:{$nin:denyRoles}
            },
            update:{
                role
            }
        })
        if(!user){
            throw new NotFoundException("Failed to find matching result")
        }
        return successResponse({res,})
    }

    sendFriendRequest=async (req:Request,res:Response):Promise<Response>=>{
        const {userId}= req.params as unknown as {userId: Types.ObjectId}
        const checkFriendRequestExists= await this.friendRequestModel.findOne({
            filter:{
                createdBy:{$in:[req.user?._id,userId]},
                sentTo: {$in:[req.user?._id,userId]}
            }
        })
        if(checkFriendRequestExists){
            throw new ConflictException("Friend request already exists")
        }
        const user= await this.userModel.findOne({filter:{_id:userId}})
        if(!user){
            throw new NotFoundException("invalid recipient")
        }
        const [friendRequest]= (await this.friendRequestModel.create({
            data:[
                {
                    createdBy: req.user?._id as Types.ObjectId,
                    sentTo:userId
                }
            ]
        })) || []

        if(!friendRequest){
            throw new BadRequestException("Something went wrong")
        }
        
        return successResponse({res,statusCode:201})
    }

    acceptFriendRequest=async (req:Request,res:Response):Promise<Response>=>{
        const {requestId}= req.params as unknown as {requestId: Types.ObjectId}
        const friendRequest= await this.friendRequestModel.findOneAndUpdate({
            filter:{
                _id: requestId,
                sentTo: req.user?._id,
                acceptedAt:{$exists:false}

            },
            update:{
                accedptedAt: new Date()
            }
        })
        if(!friendRequest){
            throw new NotFoundException("Failed to find matching result")
        }
        await Promise.all([
            await this.userModel.updateOne({
                filter:{_id:friendRequest.createdBy},
                update:{
                    $addToSet:{friends: friendRequest.sentTo}
                }
            }),

            await this.userModel.updateOne({
                filter:{_id:friendRequest.sentTo},
                update:{
                    $addToSet:{friends: friendRequest.createdBy}
                }
            })
        ])
      
        return successResponse({res,})
    }

    updateBasicInfo=async (req:Request,res:Response):Promise<Response>=>{
        
        const user = await this.userModel.findOneAndUpdate({
            filter:{
                _id: req.user?._id
            },
            update:req.body
        })
        
       if(!user){
            throw new NotFoundException("user not found or failed to update this resource")
        }

        return successResponse({res})
    }

    updatePassword=async (req:Request,res:Response):Promise<Response>=>{
        
        const {password}=req.body
        
        const user = await this.userModel.findOneAndUpdate({
            filter:{
                _id: req.user?._id
            },
            update:{
                password:password,
            }

        })

         if(!user){
            throw new NotFoundException("user not found or failed to update password")
        }

        return successResponse({res})
    }

    updateEmail=async (req:Request,res:Response):Promise<Response>=>{
        
        const {email}=req.body
        
        const user = await this.userModel.findOneAndUpdate({
            filter:{
                _id: req.user?._id
            },
            update:{
                email:email,
            }

        })

         if(!user){
            throw new NotFoundException("user not found or failed to update email")
        }

        return successResponse({res})
    }


    freezeAccount= async(req:Request,res:Response):Promise<Response>=>{
        const {userId} = req.params as IFreezeAccountDto || {}
        if(userId && req.user?.role !== RoleEnum.admin){
            throw new ForbiddenException("Not authorized user")
        }

        const user= await this.userModel.updateOne({
            filter:{
                _id:userId || req.user?._id,
                freezedAt: {$exists:false}
            },
            update:{
                freezedAt: new Date(),
                freezedBy: req.user?._id,
                changeCredentialsTime: new Date(),
                $unset:{
                    restoredAt:1,
                    restoredBy:1
                }
            }
        })

        if(!user){
            throw new NotFoundException("user not found or failed to delete this resource")
        }

        return successResponse({res})
    }

    restoreAccount= async(req:Request,res:Response):Promise<Response>=>{
        const {userId} = req.params as IRestoreAccountDto
        
        const user= await this.userModel.updateOne({
            filter:{
                _id:userId ,
                freezedBy: {$ne:userId}
            },
            update:{
                restoredAt: new Date(),
                restoredBy: req.user?._id,
                
                $unset:{
                    FreezedAt:1,
                    FreezedBy:1
                }
            }
        })

        if(!user.matchedCount){
            throw new NotFoundException("user not found or failed to restore this resource")
        }

        return successResponse({res})
    }

     hardDeleteAccount= async(req:Request,res:Response):Promise<Response>=>{
        const {userId} = req.params as IHardDeleteAccountDto
        
        const user= await this.userModel.deleteOne({
            filter:{
                _id:userId ,
                freezedAt: {$exists:true}
            },
            
        })

        if(!user.deletedCount){
            throw new NotFoundException("user not found or failed to hard delete this resource")
        }

        await deleteFoldersByPrefix({path:`users/${userId}`})
        return successResponse({res})
    }

    logout=async (req:Request,res:Response):Promise<Response>=>{

        const {flag}:ILogoutDto= req.body
        let statusCode:number =200

        const update: UpdateQuery<IUser>={}
        switch(flag){
            case logoutEnum.all:
                update.changeCredentialsTime=new Date()
                break
            default:
                await createRevokeToken(req.decoded as JwtPayload)
                statusCode=201
                break
        }

        await this.userModel.updateOne({
            filter:{_id:req.decoded?._id},
            update
        })
        
        return res.status(statusCode).json({
            message:"Done"
        })
    }

    refreshToken= async (req:Request,res:Response):Promise <Response>=>{
        const credentials=await createLoginCredentials(req.user as HUserDocument)
        await createRevokeToken(req.decoded as JwtPayload)
        return successResponse<ILoginResponse>({res,statusCode:201,data:{credentials}})
    }
}

export default new UserService()