
// export interface ISignupBodyInputsDTO{
//     username: string
//     email: string
//     password:string
// }

import * as validators from './auth.validation'
import {z } from 'zod'

export type ISignupBodyInputsDTO=z.infer<typeof validators.signup.body>