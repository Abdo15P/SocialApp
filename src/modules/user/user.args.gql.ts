import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import { GraphQLGenderEnum } from "./user.types.gql";

export const allUsers = {
                    
                    gender:{type: GraphQLGenderEnum}
                }
export const search = {
                    email:{type: new GraphQLNonNull(GraphQLString)},
                    description:"This email is useed to find a unique account"
                }

export const addFollower={
                    friendId:{type: new GraphQLNonNull(GraphQLInt)},
                    myId:{type: new GraphQLNonNull(GraphQLInt)}
                }