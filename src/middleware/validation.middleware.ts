import type { Request,Response,NextFunction } from "express-serve-static-core"
import type { ZodError, ZodType } from "zod"
import { BadRequestException } from "../utils/response/error.response"
import {z} from 'zod'

type KeyReqType= keyof Request
type SchemaType= Partial<Record<KeyReqType,ZodType>>
type ValidationErrorsType= Array<{
            key: KeyReqType
            issues: Array<{
                message: string
                path: string | number | symbol | undefined
            }>
        }>
export const validation=(schema: SchemaType)=>{
    return (req:Request,res:Response,next:NextFunction):NextFunction=>{

        const validationErrors: ValidationErrorsType=[]
        for(const key of Object.keys(schema) as KeyReqType[]){
            if(!schema[key]) continue

            const validationResult=schema[key].safeParse(req[key])
            if(!validationResult.success){
                const errors = validationResult.error as ZodError
                validationErrors.push({
                    key,
                    issues:errors.issues.map((issue)=>{
                        return { message:issue.message,path:issue.path[0]}
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
    username: z.string().min(2,{error:"min username length is 2 chars"}).max(20),
            email:z.email(),
            password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/),
            confirmPassword: z.string(),
}