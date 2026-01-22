import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response } from 'express';
import { Owner ,OwnerDocument } from '../../models/OwnerIndex';
import mongoose, { Types } from 'mongoose';
import { HomeDB } from "../../models/HomeIndex";
import { RoomDB } from "../../models/RoomIndex";
import { redis } from "../../config/redius";




interface OwnerRegisterBody{

    owner:string;
    email:string;
    password:string;

}

interface RefreshTokenPayload extends JwtPayload {
  _id: string;
}

const OwnerToken = async (ownerId: string | Types.ObjectId):Promise<{ accessToken:string;refreshToken:string}>=>{

    try {
        const owner = await Owner.findById(ownerId) as OwnerDocument | null;
        if(!owner) throw new Error("Owner not found")
    
    
        const accessToken: string = owner.generateAccessToken();
        const refreshToken: string = owner.generateRefreshToken();
    
        owner.refreshToken = refreshToken;

        


        await owner.save({validateBeforeSave:false})
    
    
        return { accessToken , refreshToken};

    } catch (error) {

        throw Error("Something went wrong while generating refresh and access token");

    }
}

const ownerRegister = async function(request:Request<{},{},OwnerRegisterBody>,response:Response){

  try {
      const { 
           owner,
           email,
           password
  
      } = request.body as {

        owner:string;
        email:string;
        password:string;


      };
      
      if([owner,email,password].some(field => field?.trim() === "")) return response.status(409).json({ message: "Owner with email or password required ."})
     
      
      const existedUser = await Owner.findOne({
          $or:[{owner},{email}]
      });
  
      if(existedUser) return response.status(409).json({ message: "Owner with email or already exists ."})
     
      const OwnerCreate = await Owner.create({
          owner,
          email,
          password
      });
  
      const OwnerDetails = await Owner.findById(OwnerCreate._id).select("-password -refreshToken")
  
      if(!OwnerDetails) return response.status(409).json("Something went wrong while registering the owner")
  
      return response.status(201).json({
          message:"Successfully Create Owner",
          OwnerDetails,
      });
  } catch (error:unknown) {

    return response.status(500).json({
      message:"Internal server error"
    })
    
  }

};


const LoginOwner = async(request:Request,response:Response) => {

    try {
        const { owner , email , password} = request.body as {

          owner:string;
          email:string;
          password:string;

        };
    
        if(!owner && !email) return response.status(409).json("Owner or email is required .");
    
        const OwnerExist: OwnerDocument | null = await Owner.findOne({
            $or:[{owner},{email}]
    
        })


    
        if(!OwnerExist) return response.status(404).json("Owner does not exist");
    
    
        const isPasswordValid = await OwnerExist.isPasswordCorrect(password);
    
    
        if(!isPasswordValid) return response.status(400).json("Invalid Owner credentials");
    
        const { accessToken , refreshToken } = await OwnerToken(OwnerExist._id);
        
        await redis.set(
          `refresh_token:${OwnerExist._id}`,
          refreshToken,
          "EX",
          7 * 24 * 60 * 60
        )

    
    
        const loggendInOwner = await Owner.findById(OwnerExist._id).select("-password -refreshToken")

        



    
    
        const options:{
          httpOnly:boolean;
          secure: boolean;
          sameSite: "none" | "lax" | "strict" | undefined;
        } = {
    
            httpOnly:true,
            secure:process.env.NODE_ENV === "production",
            sameSite:process.env.NODE_ENV === "production" ? "none" : "lax"
    
        }
        

    
        return response.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json({
            message:"User logged In successfully",
        })
    
    } catch (error: any) {
        return response.status(400).json({ error: error.message });

    }
}


const LogoutOwner = async(request:Request,response:Response) => {

   try {
     const token = request.cookies?.accessToken || request.header("Authorization")?.replace("Bearer","")
 
     if (!token) {
       return response.status(401).json({ message: "No token found" });
     }
 
     await redis.set(`blacklist:${token}`, "true", "EX", 900);
 
     if(request.owner?._id){
       
       await redis.del(`refresh_token:${request.owner._id}`)
       await Owner.findByIdAndUpdate(
         request.owner._id,
         {
             $unset: {
                 refreshToken:1
             }
         },
         {
             new:true
 
         }
     )
       
     };
 
   
   const options = {
             httpOnly: true,
             secure: process.env.NODE_ENV === "production",
   };
 
     return response.status(200)
     .clearCookie("accessToken",options)
     .clearCookie("refreshToken",options)
     .json({
         message:"User Logged Out "
     })
   } catch (error) {

    return response.status(500).json({ message: "Logout failed"})
    
   }

   
}


const RefreshAccessToken = async (request: Request,response: Response): Promise<Response> => {

  try {
    const incomingRefreshToken =  request.cookies?.refreshToken || request.body?.refreshToken;

    if (!incomingRefreshToken) {
      return response.status(401).json({ message: "Unauthorized request" });
    }

    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET as string) as RefreshTokenPayload;

    const owner = await Owner.findById(decodedToken._id);

    if (!owner || incomingRefreshToken !== owner.refreshToken) {
      return response
        .status(401)
        .json({ message: "Refresh token expired or reused" });
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await OwnerToken(owner._id);

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
    };

    return response
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json({
        message: "Access token refreshed",
      });
  } catch (error) {
    return response.status(401).json({
      message: "Invalid refresh token",
    });
  }
};

const changeCurrentPassword = async(request:Request,response:Response): Promise<Response> => {

 try {
   const { oldPassword , newPassword } = request.body as {
    oldPassword:string;
    newPassword:string;
   };
 
   if(!oldPassword || !newPassword) return response.status(401).json({message:"Old and new password are required"})
 
   const owner = await Owner.findById(request.owner?._id);
   if(!owner) return response.status(404).json({message:"Owner not found"})
 
 
   const isPasswordCorrect: boolean = await owner.isPasswordCorrect(oldPassword);
 
 
   if(!isPasswordCorrect) return response.status(401).json({message:"Invalid old Password"})
 
 
 
   owner.password = newPassword;
   await owner.save()
 
   return response.status(200).status(200).json({ message:"Password changed successfully"})
 
 
 } catch (error:unknown) {

  return response.status(500).json({
    message:"Something went wrong",
  })
  
 }

}

const OwnerAccountDelete = async( request:Request ,response:Response) => {

   const session = await mongoose.startSession();
    session.startTransaction()
  
    try {
   
  
    const currentOwner = request.owner._id;
    const { confirmPassword } = request.body as {
      confirmPassword:string;
    }; 




  
    if(!confirmPassword) return response.status(400).json({ message:"Confirm Password is Required to delete account ."})
    
    const owner = await Owner.findById(currentOwner).session(session)


    if(!owner) return response.status(404).json({ message:"Owner not found ."})
    
    const isPasswordValid = await owner.isPasswordCorrect(confirmPassword);
    if(!isPasswordValid) return response.status(401).json({ message:"Incorrect password"})
    
    const OwnerHome = await HomeDB.find({ owner:currentOwner}).session(session);
    const OwnerHomeIds = OwnerHome.map(Home=>Home._id);

  
  
    await RoomDB.deleteMany({home:{$in:OwnerHomeIds}}).session(session);
    await HomeDB.deleteMany({owner:currentOwner}).session(session);
  
    await Owner.findByIdAndDelete(currentOwner).session(session)
  
    await session.commitTransaction();
    session.endSession()
  
    return response.status(200).json({
        message: "Account deleted successfully",
      });
  
} catch (error) {

    console.error("DELETE ACCOUNT ERROR 👉", error);
  
  await session.abortTransaction();
  session.endSession();

  return response.status(500).json({
      message: "Failed to delete account",
    });
  
  
}
  


}




export {
    ownerRegister,
    LoginOwner,
    LogoutOwner,
    RefreshAccessToken,
    changeCurrentPassword,
    OwnerAccountDelete,
}