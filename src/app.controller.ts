import {resolve} from 'node:path'
import {config} from 'dotenv'
config({path: resolve("./config/.env.development")})



import express from "express"
import type {Request, Express,Response} from "express"
import cors from "cors"
import helmet from "helmet"
import {rateLimit} from "express-rate-limit"
import authController from "./modules/auth/auth.controller"
import { globalErrorHandling } from './utils/response/error.response'
import db from './DB/connection.db'



const  bootstrap=(): void =>{
    const app: Express = express()

    const port: number | string =process.env.PORT || 5000
    app.use(cors())
    app.use(express.json())
    app.use(helmet())

    const limiter= rateLimit({
        windowMs:60* 60000,
        limit:2000,
        message:{error:"Too many requests, please try again later."},
        statusCode:429
    })
    app.use(limiter)
    db.connect()
    app.get("/",(req:Request,res:Response)=>{
        res.json({message:"Welcome to Social App"})
    })
    app.use("/auth",authController)

    app.use("/*dummy",(req:Request,res:Response)=>{
        res.status(404).json({message:"Invalid routing. Please check metod and url"})
    })


    app.use(globalErrorHandling)

    app.listen(port,()=>{
        console.log(`Server running on port ${port}`)
    })
}

export default bootstrap