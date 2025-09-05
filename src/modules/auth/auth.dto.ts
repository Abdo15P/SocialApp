


// export interface ISignupBodyInputsDTO{
//     username: string
//     email: string
//     password:string
// }

import * as validators from './auth.validation'
import {z } from 'zod'

export type ISignupBodyInputsDTO=z.infer<typeof validators.signup.body>
export type IConfirmEmailBodyInputsDTO=z.infer<typeof validators.confirmEmail.body>
export type ILoginBodyInputsDTO=z.infer<typeof validators.login.body>
export type IForgotCodeInputsDTO=z.infer<typeof validators.sendForgotPasswordCode.body>
export type IVerifyForgotCodeInputsDTO=z.infer<typeof validators.verifyForgotPasswordCode.body>
export type IResetForgotCodeInputsDTO=z.infer<typeof validators.resetForgotPasswordCode.body>
export type IGmail=z.infer<typeof validators.signupWithGmail.body>