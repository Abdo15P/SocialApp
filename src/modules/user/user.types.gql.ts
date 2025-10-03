import { GraphQLEnumType, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../DB/models";
import { GraphQLUniformResponse } from "../graphql/types.gql";



export const GraphQLGenderEnum = new GraphQLEnumType({
    name:"GraphQLGenderEnum",
    values:{
        male: {value: GenderEnum.male},
        female:{ value: GenderEnum.female}
    }
})
export const GraphQLProviderEnum = new GraphQLEnumType({
    name:"GraphQLProviderEnum",
    values:{
        google: {value: ProviderEnum.google},
        system:{ value: ProviderEnum.system}
    }
})
export const GraphQLRoleEnum = new GraphQLEnumType({
    name:"GraphQLGenderEnum",
    values:{
        user: {value: RoleEnum.user},
        admin:{ value: RoleEnum.admin},
        superAdmin:{ value: RoleEnum.superAdmin}
    }
})
export const GraphQLOneUserResponse = new GraphQLObjectType({
    name:"OneUserResponse",
    fields:{
          _id:{type: GraphQLID},
          firstName: {type:new GraphQLList(GraphQLString)},
          lastName: {type:GraphQLString},
          username: {type:GraphQLString},
        
          //slug:{type:GraphQLString};
          email: {type:GraphQLString},
          confirmedAt: {type: GraphQLString},
          confirmEmailOtp: {type:GraphQLString},
        
          password: {type:GraphQLString},
          resetPasswordOtp: {type:GraphQLString},
          changeCredentialsTime: {type: GraphQLString},
        
          phone: {type:GraphQLString},
          address: {type:GraphQLString},
          profileImage:{type:GraphQLString},
          tempProfileImage:{type:GraphQLString},
          coverImages:{type:new GraphQLList(GraphQLString)},
        
          gender: {type: GraphQLGenderEnum},
          role: {type: GraphQLRoleEnum},
          provider: {type: GraphQLProviderEnum},
        
        
          freezedAt:{type: GraphQLString},
          freezedBy:{type:GraphQLID},
          restoredAt:{type: GraphQLString},
          restoredBy:{type:GraphQLID},
          friends:{type:new GraphQLList(GraphQLID)},
        
          createdAt: {type: GraphQLString},
          updatedAt:{type: GraphQLString},
          
          

    }
})
export const welcome= new GraphQLNonNull( GraphQLString)
export const allUsers= new GraphQLList(GraphQLOneUserResponse)
export const search= GraphQLUniformResponse({
                    name:"searchUser",
                    data: new GraphQLNonNull(GraphQLOneUserResponse)
                })
export const addFollower= new GraphQLList(GraphQLOneUserResponse)