import {z} from 'zod'
import { AllowCommentsEnum, AvailabilityEnum, LikeActionEnum } from '../../DB/models/post.model'
import { generalFields } from '../../middleware/validation.middleware'
import { fileValidation } from '../../utils/multer/cloud.multer'


export const createComment={
    params: z.strictObject({postId:generalFields.id}),
    body: z.strictObject({
        content: z.string().min(2).max(500000).optional(),
        attachments: z.array(generalFields.file(fileValidation.image)).max(2).optional(),
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

export const replyOnComment={
    params: createComment.params.extend({
        commentId: generalFields.id
    }),
    body: createComment.body
}
export const likePost={
    params: z.strictObject({
        postId: generalFields.id
    }),
    query:z.strictObject({
        action:z.enum(LikeActionEnum).default(LikeActionEnum.like)
    })
}