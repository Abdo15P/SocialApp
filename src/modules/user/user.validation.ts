import { z } from 'zod'
import { logoutEnum } from '../../utils/security/token.security'
import { Types } from 'mongoose'

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

export const hardDelete= restoreAccount