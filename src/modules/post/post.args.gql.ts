import { GraphQLEnumType, GraphQLID, GraphQLInt, GraphQLNonNull } from "graphql";
import { LikeActionEnum } from "../../DB/models";

export const allPosts={
    page:{type: new GraphQLNonNull(GraphQLInt)},
    size:{type: new GraphQLNonNull(GraphQLInt)}
}

export const likePost={
    postId:{type: new GraphQLNonNull(GraphQLID)},
    action:{type: new GraphQLNonNull(new GraphQLEnumType({
        name:"LikeActionEnum",
        values:{
            like:{value: LikeActionEnum.like},
            umlike:{value:LikeActionEnum.unlike}
        }
    }))}
}