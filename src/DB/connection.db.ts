import { connect} from "mongoose";
import { UserModel } from "./models/User.model";


// class Database {

//   constructor() {}

//   public async connect(): Promise<void> {
//     try {
//       const uri = process.env.DB_URI;
//       if (!uri) {
//         throw new Error("DB_URI environment variable is not defined");
//       }

//       const options: ConnectOptions = {
//         serverSelectionTimeoutMS: 30000,
//       };

//       await mongoose.connect(uri, options);
      
//       console.log("Database connected successfully");
//     } catch (error) {
//       console.error("Failed to connect to database:", error);
      
//     }
//   }

// }

// export default new Database();

const connectDB =async():Promise<void>=>{
  try{
    const result= await connect(process.env.DB_URI as string,{
      serverSelectionTimeoutMS:30000,
    })
    await UserModel.syncIndexes()
    console.log(result.models)
    console.log("DB connected successfully")
  }catch(error){
    console.log("Failed to connect to DB")
  }
}
export default connectDB