
import  { HydratedDocument, Schema, model,models,Types} from "mongoose";
import { generateHash } from "../../utils/security/hash.security";
import { emailEvent } from "../../utils/email/email.event";


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

  //slug:string;
  email: string;
  confirmedAt?: Date;
  confirmEmailOtp?: string;

  password: string;
  resetPasswordOtp?: string;
  changeCredentialsTime?: Date;

  phone?: string;
  address?: string;
  profileImage?:string;
  tempProfileImage?:string;
  coverImages?:string[];

  gender: GenderEnum;
  role: RoleEnum;
  provider: ProviderEnum;


  freezedAt?:Date;
  freezedBy?:Types.ObjectId;
  restoredAt?:Date;
  restoredBy?:Types.ObjectId;

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
  
  //slug: { type: String, required: true, minLength:5, maxLength:51 },
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
  tempProfileImage: {type:String},
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

  freezedAt:Date,
  freezedBy:{type: Schema.Types.ObjectId, ref:"User"},
  restoredAt:Date,
  restoredBy:{type: Schema.Types.ObjectId, ref:"User"},
  
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

userSchema.pre("save",async function(this:HUserDocument &{wasNew:boolean; confirmEmailPlainOtp?: string}, next){
  
  this.wasNew=this.isNew
  if(this.isModified("password")){
    this.password = await generateHash(this.password)
  }
  if(this.isModified("confirmEmailOtp")){
    this.confirmEmailPlainOtp=this.confirmEmailOtp as string
    this.confirmEmailOtp = await generateHash(this.confirmEmailOtp as string)
  }

  next()
})

userSchema.post("save",async function(doc,next){
  const that= this as HUserDocument & {wasNew:boolean; confirmEmailPlainOtp?: string}
  
  if(that.wasNew && that.confirmEmailPlainOtp){
    emailEvent.emit("confirmEmail",{to:this.email,otp:that.confirmEmailPlainOtp})
  }
  next()
})

userSchema.pre(["find","findOne"],function(next){
  const query= this.getQuery()
  if(query.paranoid===false){
    this.setQuery({...query})
  }else{
    this.setQuery({...query,freezedAt:{$exists:false}})
  }
  next()
})


export const UserModel = models.User || model<IUser>("User", userSchema);
export type HUserDocument= HydratedDocument<IUser>
UserModel.syncIndexes();