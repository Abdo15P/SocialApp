import type { Request,Response,NextFunction } from "express-serve-static-core"
import type { ZodError, ZodType } from "zod"
import { BadRequestException } from "../utils/response/error.response"
import {z} from 'zod'
import { Types } from "mongoose"

type KeyReqType= keyof Request
type SchemaType= Partial<Record<KeyReqType,ZodType>>
type ValidationErrorsType= Array<{
            key: KeyReqType
            issues: Array<{
                message: string
                path:( string | number | symbol | undefined)[]
            }>
        }>
export const validation=(schema: SchemaType)=>{
    return (req:Request,res:Response,next:NextFunction):NextFunction=>{

        const validationErrors: ValidationErrorsType=[]
        for(const key of Object.keys(schema) as KeyReqType[]){
            if(!schema[key]) continue

            if(req.file){
                req.body.attachment= req.file
            }
            if(req.files){
                req.body.attachments= req.files
            }
            const validationResult=schema[key].safeParse(req[key])
            if(!validationResult.success){
                const errors = validationResult.error as ZodError
                validationErrors.push({
                    key,
                    issues:errors.issues.map((issue)=>{
                        return { message:issue.message,path:issue.path}
                    })
                })
            }
        }
        if(validationErrors.length){
            throw new BadRequestException("validation error",{
                validationErrors
            })
        }


        return next() as unknown as NextFunction
    }
}

export const generalFields={
    firstName: z.string().min(2,{error:"min username length is 2 chars"}).max(20),
    lastName: z.string().min(2,{error:"min username length is 2 chars"}).max(20),
    username: z.string().min(2,{error:"min username length is 2 chars"}).max(20),
            email:z.email(),
            otp:z.string().regex(/^\d{6}$/),
            password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/),
            confirmPassword: z.string(),
            file: function(mimetype: string[]){
                return z.strictObject({
                fieldname: z.string(),
                originalname:z.string(),
                encoding:z.string(),
                mimetype:z.enum(mimetype),
                buffer:z.any().optional(),
                path: z.string().optional,
                size: z.number()
            }).refine((data)=>{
                return data.buffer || data.path
            },{
                error: "neither path nor buffer is available",path:["file"]
            })
            },
            id: z.string().refine((data)=>{
            return Types.ObjectId.isValid(data)
        },{
            error:"Invalid ObjectId format"
        })
}