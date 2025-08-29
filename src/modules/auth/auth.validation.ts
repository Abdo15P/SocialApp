import {z} from 'zod'
import { generalFields } from '../../middleware/validation.middleware'


export const login ={
    body: z.object({
        
        email:generalFields.email,
        password: generalFields.password,
        
    })
}
export const signup ={
    body: login.body.extend({
        username: generalFields.username,
        confirmPassword:generalFields.confirmPassword,
    }).superRefine((data,ctx)=>{

        if(data.confirmPassword !== data.password){
            ctx.addIssue({
                code: "custom",
                path:["confirmPassowrd"],
                message:"Password and confirm password mismatch"
            })
        }

        // if(data.username?.split(" ")?.length !=2){
        //     ctx.addIssue({
        //         code: "custom",
        //         path:["username"],
        //         message:"Username must consist of 2 parts"
        //     })
        // }
    })
    
    
    // .refine((data)=>{
    //     return data.confirmPassword=== data.password
    // },{error:"Password and confirm password mismatch"})
}

export const confirmEmail ={
    body: z.strictObject({
        
        email:generalFields.email,
        otp: generalFields.otp,
        
    })
}

export const signupWithGmail ={
    body: z.strictObject({
        
        idToken:z.string()
        
    })
}

export const sendForgotPasswordCode ={
    body: z.strictObject({
        
       email: generalFields.email
        
    })
}

export const verifyForgotPasswordCode ={
    body: sendForgotPasswordCode.body.extend({
        
       otp: generalFields.otp,
        
    })
}

export const resetForgotPasswordCode ={
    body: verifyForgotPasswordCode.body.extend({
        
       otp: generalFields.otp,
       password: generalFields.password,
       confirmPassword: generalFields.confirmPassword
        
    }).refine((data)=>{
        return data.password=== data.confirmPassword
    },{message:"password mismatch with confirm-password",path:['confirmPassword']})
}