import { HPostDocument, LikeActionEnum } from "../../DB/models";
import { IAUthGraph } from "../graphql/schema.interface.qgl";
import { PostService } from "./post.service";

export class PostResolver {
    private postService:PostService= new PostService()
     constructor(){}

     allPosts= async (parent:unknown,args:{page:number,size:number},context:IAUthGraph):Promise<
     {
             docsCount?:number;
             limit?:number;
             pages?:number;
             currentPage?:number |undefined;
             result:HPostDocument[];
         }>=>{
        return await this.postService.allPosts(args,context.user)
     }

          likePost= async (parent:unknown,args:{postId:string,action:LikeActionEnum},context:IAUthGraph):Promise<HPostDocument>=>{
        return await this.postService.likeGraphPost(args,context.user)
     }
}