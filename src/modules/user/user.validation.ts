import { z } from 'zod'
import { logoutEnum } from '../../utils/security/token.security'
import { Types } from 'mongoose'
import { generalFields } from '../../middleware/validation.middleware'

export const logout = {
    body: z.strictObject({
        flag: z.enum(logoutEnum).default(logoutEnum.only)
    })
}

export const freezeAccount = {
    params: z.object({
        userId: z.string().optional()
    }).optional().refine((data) =>{
        return data?.userId? Types.ObjectId.isValid(data.userId): true
    }, { error: "invalid objectId format", path:["userId"] })
}

export const restoreAccount = {
    params: z.object({
        userId: z.string()
    }).refine((data) =>{
        return Types.ObjectId.isValid(data.userId)
    }, { error: "invalid objectId format", path:["userId"] })
}

export const updateBasicInfo={
    body: z.strictObject({
       firstName: generalFields.firstName,
       lastName: generalFields.lastName
        
}).required()
}
export const updateEmail={
    body: z.strictObject({
        email:generalFields.email
        
}).required()
}
export const updatePassword={
    body: z.strictObject({
        password:generalFields.password,
        confirmPassowrd: generalFields.confirmPassword
    }).required()
}

export const hardDelete= restoreAccount