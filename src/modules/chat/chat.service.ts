
import { Request, Response } from 'express';
import { BadRequestException, NotFoundException } from '../../utils/response/error.response';
import { ICreateChattingGroupParamsDTO, IGetChatParamsDTO, IGetChatQueryParamsDTO, IGetChattingGroupParamsDTO, IJoinRoomDTO, ISayHiDTO, ISendGroupMessageDTO, ISendMessageDTO } from './chat.dto';
import { successResponse } from '../../utils/response/success.response';
import { ChatRepository, UserRepository } from '../../DB/repository';
import { ChatModel, UserModel } from '../../DB/models';
import { Types } from 'mongoose';
import { IGetChatResponse } from './chat.entities';
import { connectedSockets } from '../gateway';
import {v4 as uuid} from 'uuid'

import { deleteFile, uploadFile } from '../../utils/multer/s3.config';

export class ChatService{
    private chatModel : ChatRepository= new ChatRepository(ChatModel)
    private userModel : UserRepository= new UserRepository(UserModel)

    constructor(){}

    getChat= async (req:Request,res:Response):Promise <Response>=>{
        
        const {userId}= req.params as IGetChatParamsDTO
        const {page,size}:IGetChatQueryParamsDTO= req.query 
        const chat= await this.chatModel.findOneChat({
            filter:{
                participants:{
                    $all:[
                        req.user?._id as Types.ObjectId,
                        Types.ObjectId.createFromHexString(userId)
                    ]
                },
                group:{$exists:false}
            },
            options:{
                populate:[
                    {
                        path:"participants",
                        select:"firstName lastName email gender profilePicture"
                    }
                ]
            },
            page,
            size
        })

        if(!chat){
            throw new BadRequestException("Failed to find matching chat instance")
        }

        return successResponse<IGetChatResponse>({res,data:{chat}})
    }

     getChattingGroup= async (req:Request,res:Response):Promise <Response>=>{
        
        const {groupId}= req.params as IGetChattingGroupParamsDTO
        const {page,size}:IGetChatQueryParamsDTO= req.query 
        const chat= await this.chatModel.findOneChat({
            filter:{
                _id:Types.ObjectId.createFromHexString(groupId),
                paticipants:{$in: req.user?._id as Types.ObjectId},
                group:{$exists:true}
            },
            options:{
                populate:[
                    {
                        path:"messages.createdBy",
                        select:"firstName lastName email gender profilePicture"
                    }
                ]
            },
            page,
            size
        })

        if(!chat){
            throw new BadRequestException("Failed to find matching chat instance")
        }

        return successResponse<IGetChatResponse>({res,data:{chat}})
    }

    createChattingGroup= async (req:Request,res:Response):Promise <Response>=>{
        
        const {group,participants}:ICreateChattingGroupParamsDTO= req.body
        const dbParticipants= participants.map((participant:string)=>{
            return Types.ObjectId.createFromHexString(participant)
        })
        const users= await this.userModel.find({
            filter:{
                _id:{$in: dbParticipants},
                friends:{$in:req.user?._id as Types.ObjectId}

            }
        })
        if(participants.length != users.length){
            throw new NotFoundException("Some or all recipeints are invalid")
        }
        let group_image: string | undefined = undefined
        const roomId= group.replaceAll(/\s+/g,"_"+"_"+uuid())
        if(req.file){
            group_image= await uploadFile({
                file: req.file as Express.Multer.File,
                path:`chat/${roomId}`
            })
        }

        dbParticipants.push(req.user?._id as Types.ObjectId)
        const [chat]= (await this.chatModel.create({
            data:[
                {
                    createdBy: req.user?._id as Types.ObjectId,
                    group,
                    roomId,
                    group_image: group_image as string,
                    message:[],
                    participants:dbParticipants
                }
            ]
        })) || []

        if (!chat){
            if(group_image){
                await deleteFile({Key: group_image})
            }
            throw new BadRequestException("Failed to generate this group")
        }

        return successResponse<IGetChatResponse>({res,statusCode:201,data:{chat}})
    }

    sayHi= async ({message,socket,callback,io}:ISayHiDTO)=>{
        try {
            console.log({message})
            throw new BadRequestException("some error")
        callback? callback("Hello BE to FE"):undefined
        } catch (error) {
            return socket.emit("custom_error",error)
        }
    }

    sendMessage= async ({content,sentTo,socket,io}:ISendMessageDTO)=>{
        try {
            const createdBy= socket.credentials?.user._id as Types.ObjectId
            console.log({content, sentTo,createdBy})
            
            const user= await this.userModel.findOne({
                filter:{
                    _id: Types.ObjectId.createFromHexString(sentTo),
                    friends:{$in:createdBy}

                }
            })
            if(!user){
                throw new NotFoundException("Invalid recipient friend")
            }
            const chat = await this.chatModel.findOneAndUpdate({
                filter:{
                participants:{
                    $all:[
                        createdBy as Types.ObjectId,
                        Types.ObjectId.createFromHexString(sentTo)
                    ]
                },
                group:{$exists:false}
            },
            update:{
                $addToSet:{messages:{content,createdBy}}
            }
            })

            if(!chat){
                const [newChat]= await this.chatModel.create({
                    data:[
                        {
                            createdBy,
                            message:[{content,createdBy}],
                            participants:[
                                createdBy as Types.ObjectId,
                                Types.ObjectId.createFromHexString(sentTo)
                            ]
                        }
                    ]

                }) || []

                if(!newChat){
                    throw new BadRequestException("Failed to create this chat instance")
                }
            }
            io?.to(connectedSockets.get(createdBy.toString() as string)as string).emit("successMessage",{content})

            io?.to(connectedSockets.get(sentTo) as string).emit("newMessage",{content,from: socket.credentials?.user})
        
        } catch (error) {
            return socket.emit("custom_error",error)
        }
    }

    joinRoom= async ({roomId,socket,io}:IJoinRoomDTO)=>{
        try {
            const chat= await this.chatModel.findOne({
                filter:{
                    roomId,
                    group:{$exists:true},
                    participants: {$in: socket.credentials?.user._id}
                }
            })
            if(!chat){
                throw new NotFoundException("Failed to find matching room")
            }
            socket.join(chat.roomId as string)

        } catch (error) {
            return socket.emit("custom_error",error)
        }
    }

    sendGroupMessage= async ({content,groupId,socket,io}:ISendGroupMessageDTO)=>{
        try {
            const createdBy= socket.credentials?.user._id as Types.ObjectId
            
            
            
            const chat = await this.chatModel.findOneAndUpdate({
                filter:{
                    _id:Types.ObjectId.createFromHexString(groupId),
                participants:{$in: createdBy as Types.ObjectId},
                group:{$exists:true}
            },
            update:{
                $addToSet:{messages:{content,createdBy}}
            }
            })

            if(!chat){
                
                    throw new BadRequestException("Failed to find matching room")
                
            }
            io?.to(connectedSockets.get(createdBy.toString() as string)as string).emit("successMessage",{content})

            socket?.to(chat.roomId as string).emit("newMessage",{content,from: socket.credentials?.user,groupId})
        
        } catch (error) {
            return socket.emit("custom_error",error)
        }
    }
}