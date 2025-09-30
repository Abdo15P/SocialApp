import { Server, Socket } from 'socket.io'
import { decodeToken, TokenEnum } from '../../utils/security/token.security'
import { HUserDocument } from '../../DB/models';
import { JwtPayload } from 'jsonwebtoken';
import {Server as HttpServer} from 'node:http'
import { IAuthSocket } from './gateway.interface';
import { ChatGateway } from '../chat';
import { BadRequestException } from '../../utils/response/error.response';
// import db from './DB/connection.db'


export const connectedSockets= new Map<string,string>()
let io: undefined | Server = undefined

export const initializeIo=(httpServer:HttpServer)=>{
        io= new Server(httpServer,{
            cors:{
                origin:"*"
            }
        })
    
        io.use(async (socket: IAuthSocket, next)=>{
            try{
                const {user,decoded}=await decodeToken({
                    authorization: socket.handshake?.auth.authorization || "",
                    tokenType: TokenEnum.access
                })
                connectedSockets.set(user._id.toString(),socket.id)
                socket.credentials={user,decoded}
                next()
            }catch(error:any){
                next(error)
            }
        })

        function disconnection(socket:IAuthSocket){
             return socket.on("disconnect",()=>{
                const userId=socket.credentials?.user._id?.toString() as string
                connectedSockets.delete(userId)
                getIo().emit("offline_user",userId)
                console.log(`Logout from ${socket.id}`)
            })
        }
    

        const chatGateway: ChatGateway= new ChatGateway()
        io.on("connection",(socket: IAuthSocket)=>{
            chatGateway.register(socket,getIo())
        disconnection(socket)
    
        })

}

export const getIo=():Server=>{
    if(!io){
        throw new BadRequestException("Failed to establish sever socket Io")
    }
    return io
}