import mongoose , { Schema , Document , Types,SaveOptions } from "mongoose";
import jwt, { Secret } from "jsonwebtoken";
import bcrypt from "bcryptjs";

export interface OwnerDocument extends Document {

  owner:string;
  email:string;
  password:string;
  refreshToken:string;
  homes:Types.ObjectId[];

  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;

};

const ownerSchema = new Schema<OwnerDocument>(
  {
    owner:{ type: String , required: true },
    email:{ type: String , required: true },
    password:{ type:String , required:true},
    refreshToken: { type:String },

    homes:[
      {
        type:Types.ObjectId,
        ref:"HomeDB"
      }
    ],

  

  },
  { timestamps: true}
);


ownerSchema.pre<OwnerDocument>("save", async function () {

  try {

    if(!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password,10);
    
  } catch (error) {

    throw error;

  }
});

ownerSchema.methods.isPasswordCorrect = async function(password:string){
  return await bcrypt.compare(password,this.password)

};

ownerSchema.methods.generateAccessToken = function(): string{

  type AccessPayload = {
    _id:string;
    owner:string;
    email:string

  }


   const payload: AccessPayload = {
    _id: this._id.toString(),
    owner: this.owner,
    email: this.email
  };

  return jwt.sign(
    payload,
    process.env.ACCESS_TOKEN_SECRET!,
    {
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY! as jwt.SignOptions["expiresIn"]
    }
  )

};

ownerSchema.methods.generateRefreshToken = function(): string{

  type RefreshPayload = {
    _id:string;

  }

  const payload: RefreshPayload = {
     _id: this._id.toString(),
  }


  return jwt.sign(
    payload,
    process.env.REFRESH_TOKEN_SECRET!,

    {
      expiresIn:process.env.REFRESH_TOKEN_EXPIRY! as jwt.SignOptions["expiresIn"]
    }
  )
}

export const Owner = mongoose.model<OwnerDocument>("OwnerDB",ownerSchema);

