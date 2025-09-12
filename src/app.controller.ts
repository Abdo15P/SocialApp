import {resolve} from 'node:path'
import {config} from 'dotenv'
config({path: resolve("./config/.env.development")})



import express from "express"
import type {Request, Express,Response} from "express"
import cors from "cors"
import helmet from "helmet"
import {rateLimit} from "express-rate-limit"

import { authRouter,userRouter,postRouter } from './modules'
// import authController from "./modules/auth/auth.controller"
// import userController from "./modules/user/user.controller"
import { BadRequestException, globalErrorHandling } from './utils/response/error.response'
import connectDB from './DB/connection.db'
import { createGetPreSignedLink, getFile } from './utils/multer/s3.config'
import { promisify } from 'node:util'
import { pipeline } from 'node:stream'


// import db from './DB/connection.db'

const createS3WriteStreamPipe= promisify(pipeline)

const  bootstrap= async(): Promise<void> =>{
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
    //db.connect()
    await connectDB()

    


    app.get("/",(req:Request,res:Response)=>{
        res.json({message:"Welcome to Social App"})
    })
    app.use("/auth",authRouter)
    app.use("/user",userRouter)
    app.use("/post",postRouter)


    app.get("upload/pre-signed/*path",async(req:Request,res:Response):Promise<Response>=>{
        const {downloadName,download="false",expiresIn=120}=req.query as {downloadName?: string, download?:string,expiresIn?:number}
        const {path}=req.params as unknown as {path:string[]}
        const Key= path.join("/")
        const url= await createGetPreSignedLink({Key,downloadName:downloadName as string,download,expiresIn})
        return res.json({message:"Done",data:{url}})

        
    })

    app.get("upload/*path",async(req:Request,res:Response):Promise<void>=>{
        const {downloadName,download="false"}=req.query as {downloadName?: string, download?:string}
        const {path}=req.params as unknown as {path:string[]}
        const Key= path.join("/")
        const s3Response= await getFile({Key})

        if(!s3Response?.Body){
            throw new BadRequestException("Failes to fetch this asset")
        }


        res.setHeader("Content-type",`${s3Response.ContentType || "application/octet-stream"}`)
        
        if(download==="true"){
            res.setHeader("Content-Disposition",`attachment; filename="${downloadName || Key.split("/").pop()}"`)
        }
        
        
        return await createS3WriteStreamPipe(s3Response.Body as NodeJS.ReadableStream,res)
    })

    


    app.use("/*dummy",(req:Request,res:Response)=>{
        res.status(404).json({message:"Invalid routing. Please check metod and url"})
    })


    app.use(globalErrorHandling)

    app.listen(port,()=>{
        console.log(`Server running on port ${port}`)
    })
}

export default bootstrap