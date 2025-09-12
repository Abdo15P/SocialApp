import { UserModel } from './../../DB/models/User.model';
import { successResponse } from "../../utils/response/success.response"
import { Request,Response } from "express"
import { PostRepository, UserRepository } from '../../DB/repository';
import { HPostDocument, LikeActionEnum, PostModel } from '../../DB/models/post.model';
import { BadRequestException, NotFoundException } from '../../utils/response/error.response';
import { deleteFiles, uploadFiles } from '../../utils/multer/s3.config';
import {v4 as uuid} from 'uuid'
import { LikePostQueryInputsDto } from './post.dto';
import { UpdateQuery } from 'mongoose';



class PostService{
    private UserModel= new UserRepository(UserModel)
    private PostModel= new PostRepository(PostModel)
    constructor(){}
        createPost= async (req:Request, res: Response):Promise<Response>=>{
            if(req.body.tags?.length && (await this.UserModel.find({filter: {_id:{$in: req.body.tags}}})).length !== req.body.tags.length){
                throw new NotFoundException("Some of the mentioned users do not exist")
            } 
            
            let attachments:string[]=[]
            let assetsFolderId:string=uuid()
            if(req.files?.length){
                attachments= await uploadFiles({
                    files: req.files as Express.Multer.File[],
                    path:`users/${req.user?._id}/post/${assetsFolderId}`
                })
            }

            const [post]= (await this.PostModel.create({
                data:[
                    {
                        ...req.body,
                        attachments,
                        assetsFolderId,
                        createdBy: req.user?._id
                    }
                ]
            })) || []

            if(!post){
                if (attachments.length){
                    await deleteFiles({urls:attachments})
                }
                throw new BadRequestException("Failed to create this post")
            }
            
            
            return successResponse({res,statusCode:201})
        
    }

    likePost= async (req:Request,res:Response):Promise<Response>=>{
        const {postId}=req.params as {postId: string}
        const {action}=req.query as LikePostQueryInputsDto
        let update:UpdateQuery<HPostDocument>={ $addToSet:{likes:req.user?._id}}
        if(action ===LikeActionEnum.unlike){
            update= {$pull:{likes:req.user?._id}}
        }


        const post = await this.PostModel.findOneAndUpdate({
            filter:{_id:postId},
            update
        })
        if(!post){
            throw new NotFoundException("Invalid postId or post does not exist")
        }
        return successResponse({res})
    }
}

export default new PostService