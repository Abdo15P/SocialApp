
import { ISignupBodyInputsDTO } from './auth.dto';

import type { Request,Response } from "express"
import * as DBService from "../../DB/db.service"
import {  UserModel } from "../../DB/models/User.model"
import { EmailExistsException } from '../../utils/response/error.response';
class AuthenticationService {
    constructor(){}

    signup=async (req:Request,res:Response):Promise<Response> =>{

        
        let { username,email,password}: ISignupBodyInputsDTO=req.body
    if (await DBService.findOne({ model: UserModel, filter: { email } })) {
        throw new EmailExistsException("Email Exists")
    }

    
    const user = await DBService.create({ model: UserModel, data: [{ username, email, password }] })
     
    console.log(username,email,password)
    return res.status(201).json({message:"Done", data: user})

    
}

login=(req:Request,res:Response):Response =>{
    return res.json({message:"Done"})
}
}
export default new AuthenticationService()