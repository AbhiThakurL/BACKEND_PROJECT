import mongoose, { Schema , Document , Types } from "mongoose";

export enum HomeCategory{
    RENT="Rent",
    SALE="Sale",
    PG="PG",
}

export interface HomeDocument extends Document {

    address:string;
    state:string;
    zip:string;
    category:HomeCategory;
    owner:Types.ObjectId;
    rooms:Types.ObjectId[];

};


const homeSchema = new Schema<HomeDocument>(
 {

    address: { type:String , required: true},
    state: { type:String , required:true},
    zip: { type:String , required:true},

    category:{

        type:String,
        enum:Object.values(HomeCategory),
        default: HomeCategory.RENT, 
        required:true,
        index:true

    },


    owner:{
        type:Types.ObjectId,
        ref:"OwnerDB",
        required:true
    },
    rooms:[
        {
            type:Types.ObjectId,
            ref:"RoomDB"
        }
    ]
 },
 { timestamps: true}
);

export const HomeDB = mongoose.model<HomeDocument>("HomeDB",homeSchema);


