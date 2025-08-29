import {z} from 'zod'
import { logoutEnum } from '../../utils/security/token.security'

export const logout={
    body: z.strictObject({
        flag:z.enum(logoutEnum).default(logoutEnum.only)
    })
}