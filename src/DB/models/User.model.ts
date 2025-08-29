import  { HydratedDocument, Schema, model,models} from "mongoose";


export enum GenderEnum {
  male= "male",
  female= "female"
}

export enum RoleEnum  {
  user= "user",
  admin= "admin"
}

export enum ProviderEnum {
  system= "system",
  google= "google"
} 

export interface IUser {
  

  firstName: string;
  lastName: string;
  username?: string;

  email: string;
  confirmedAt?: Date;
  confirmEmailOtp?: string;

  password: string;
  resetPasswordOtp?: string;
  changeCredentialsTime?: Date;

  phone?: string;
  address?: string;
  profileImage?:string;
  coverImages?:string[];

  gender: GenderEnum;
  role: RoleEnum;
  provider: ProviderEnum;

  createdAt: Date;
  updatedAt?:Date;
  
  
}

const userSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: true,
    minLength: 2,
    maxLength: [20, "first name max length is 20 chars"]
  },
  lastName: {
    type: String,
    required: true,
    minLength: 2,
    maxLength: [20, "last name max length is 20 chars"]
  },
  
  email: { type: String, required: true, unique: true },
  confirmEmailOtp:{type:String},
  confirmedAt:{type:Date},
  password: {
    type: String,
    required: function(){
      return this.provider === ProviderEnum.google ? false: true
    }
  },
  resetPasswordOtp:{type:String},
  changeCredentialsTime:{type:Date},

  phone:{type:String},
  address:{type:String},
  
  profileImage:{type:String},
 coverImages:[String],

  gender: {
    type: String,
    enum: GenderEnum,
    default: GenderEnum.male
  },
  role: {
    type: String,
    enum: RoleEnum,
    default: RoleEnum.user
  },
  provider: {
    type: String,
    enum: ProviderEnum,
    default: ProviderEnum.system
  },
  
}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

userSchema.virtual("username").set(function (value:string){
  const [firstName,lastName]=value.split(" ") || []
  this.set({firstName,lastName})
}).get(function (){
  return this.firstName + " " + this.lastName
})


export const UserModel = models.User || model<IUser>("User", userSchema);
export type HUserDocument= HydratedDocument<IUser>
UserModel.syncIndexes();