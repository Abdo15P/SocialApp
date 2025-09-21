import {z} from 'zod'
import { AllowCommentsEnum, AvailabilityEnum, LikeActionEnum } from '../../DB/models/post.model'
import { generalFields } from '../../middleware/validation.middleware'
import { fileValidation } from '../../utils/multer/cloud.multer'


export const createPost={
    body: z.strictObject({
        content: z.string().min(2).max(500000).optional(),
        attachments: z.array(generalFields.file(fileValidation.image)).max(2).optional(),
        availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.public),
        allowComments: z.enum(AllowCommentsEnum).default(AllowCommentsEnum.allow),
        tags: z.array(generalFields.id).max(10).optional()
    }).superRefine((data,ctx)=>{
        if(!data.attachments?.length && !data.content){
            ctx.addIssue({
                code:"custom",
                path:["custom"],
                message:"Post must have content or attachments"
            })
        }

        if(data.tags?.length && data.tags.length !==[...new Set(data.tags)].length){
            ctx.addIssue({
                code:"custom",
                path:["custom"],
                message:"Duplicate tagged users"
            })
        }
    })
}

export const updatePost={
    params: z.strictObject({
        postId: generalFields.id
    }),
    body: z.strictObject({
        content: z.string().min(2).max(500000).optional(),
        attachments: z.array(generalFields.file(fileValidation.image)).max(2).optional(),
        removedAttachments: z.array(z.string()).max(2).optional(),
        availability: z.enum(AvailabilityEnum).optional(),
        allowComments: z.enum(AllowCommentsEnum).optional(),
        tags: z.array(generalFields.id).max(10).optional(),
        removedTags: z.array(generalFields.id).max(10).optional()
    }).superRefine((data,ctx)=>{
        if(!Object.values(data)?.length){
            ctx.addIssue({
                code:"custom",
                path:["custom"],
                message:"All fields are empty"
            })
        }

        if(data.tags?.length && data.tags.length !==[...new Set(data.tags)].length){
            ctx.addIssue({
                code:"custom",
                path:["custom"],
                message:"Duplicate tagged users"
            })
        }
        if(data.removedTags?.length && data.removedTags.length !==[...new Set(data.removedTags)].length){
            ctx.addIssue({
                code:"custom",
                path:["removedTags"],
                message:"Duplicate removed tagged users"
            })
        }
    })
}
export const likePost={
    params: z.strictObject({
        postId: generalFields.id
    }),
    query:z.strictObject({
        action:z.enum(LikeActionEnum).default(LikeActionEnum.like)
    })
}