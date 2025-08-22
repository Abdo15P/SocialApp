import mongoose, { Schema, Model,Document} from "mongoose";

export const genderEnum = {
  male: "male",
  female: "female"
}

export const roleEnum = {
  user: "user",
  admin: "admin"
}

export const providerEnum = {
  system: "system",
  google: "google"
} 

export interface IUser extends Document{
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  gender: typeof genderEnum[keyof typeof genderEnum];
  confirmEmail?: Date;
  confirmEmailOtp?: string;
  otpStartTime?: string;
}

const userSchema = new Schema({
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
  password: {
    type: String,
    required: true
  },
  
  gender: {
    type: String,
    enum: {
      values: Object.values(genderEnum),
      message: `only ${Object.values(genderEnum)}`
    },
    default: genderEnum.male
  },
 
  confirmEmail: Date,
  confirmEmailOtp: String,
  otpStartTime: String,
}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

export const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

UserModel.syncIndexes();