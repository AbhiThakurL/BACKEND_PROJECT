import { Request, Response } from "express";
import { HomeDB } from "../../models/HomeIndex";
import mongoose from "mongoose";
import { RoomDB } from "../../models/RoomIndex";
import { redis } from "../../config/redius";


const HomeLists = async(request:Request,response:Response) => {

   try {
     const current_Owner = request.owner._id;
     const { category } = request.query;

    const cacheKey = `homes:${current_Owner}:${category || 'all'}`
    const cachedHomes = await redis.get(cacheKey);
    const trackingKey = `user_keys:${current_Owner}`; // User ke saare keys track karne ke liye

    if(cachedHomes){

        return response.status(200).json({
            OwnerHomes:JSON.parse(cachedHomes),
            source:"Redis"
        })


    }

 
     const pipeline: any[] = [
 
         {
             $match:{
                 owner:new mongoose.Types.ObjectId(current_Owner),
                 ...(category ? { category } : { })
             }
         },
 
         {
             $lookup:{
 
                 from:"roomdbs",
                 localField:"_id",
                 foreignField:"home",
                 as:"rooms"
 
             }
 
         },
 
         {
             $addFields:{
                 roomsCount:{ $size:"$rooms"}
             }
         },
         {
 
             $project:{
 
                 rooms:0,
                 _v:0
 
             }
 
         }
 
     ]
 
     const OwnerHomes = await HomeDB.aggregate(pipeline);
 
     // Data save kiya 1 ghante ke liye
     await redis.set(cacheKey,JSON.stringify(OwnerHomes),'EX',3600);
     await redis.sadd(trackingKey,cacheKey)
     await redis.expire(trackingKey, 3600);

     return response.status(200).json({
         OwnerHomes:OwnerHomes
     })
 
   } catch (error) {

    return response.status(500).json({
        message:"Failed to fetch Owner Homes "
    })
   }

}

const SingleHomeDetail = async(request:Request,response:Response) => {

   try {
     const {  OwnerHomeID } = request.params as {
         OwnerHomeID:string;
     }

 
     const current_Owner = request.owner._id;

 
     if(!mongoose.Types.ObjectId.isValid(OwnerHomeID)) return response.status(400).json({ message:"Invalid Owner Home ID" })
     
     const OwnerHome = await HomeDB.aggregate([
         
         {
             $match:{
 
                 _id:new mongoose.Types.ObjectId(OwnerHomeID),
                 owner:new mongoose.Types.ObjectId(current_Owner),
 
 
             },
         },
         {
         $lookup: {
           from: "roomdbs",
           localField: "_id",
           foreignField: "home",
           as: "rooms",
         },
       },
         {
         $addFields: {
           roomsCount: { $size: "$rooms" },
         },
       },
         {
         $project: {
           __v: 0,
         },
       },
 
 
 
     ])

     console.log(OwnerHome)

    
 
     if(!OwnerHome.length) return response.status(404).json({ message:"Owner Home not found or you do not owner this Home"})
     
     return response.status(200).json(OwnerHome[0]);
     
   } catch (error) {

    return response.status(500).json({
        message:"Failed to fetch Owner Home "
    })
    
   }


}

const HomeUpdate = async(request:Request,response:Response) =>{

   try {
     const { HomeID } = request.params as {
         HomeID:string;
     };
     const current_Owner = request.owner._id;
    const trackingKey = `user_keys:${current_Owner}`;

 
     const { address , state , zip ,category} = request.body as {
         address:string;
         state:string;
         zip:string;
         category:string;
 
     };
 
     if(!mongoose.Types.ObjectId.isValid(current_Owner)) return response.status(400).json({ message:"Invalid Owner Home ID" })
 
     const OwnerUpdateHome = await HomeDB.findOneAndUpdate(
         { 
             _id:HomeID,
             owner:current_Owner
         },
        { 
                $set: { ...request.body } // Jo data body mein aaya hai sirf wo update ho
        },
         {
             new:true,
             runValidators:true
         }
     ).select("-__v")
 
     if(!OwnerUpdateHome) return response.status(404).json({
         message:"Owner Home not found or you do not own this home"
     });

     
    const keysToDelete = await redis.smembers(trackingKey);
        if (keysToDelete.length > 0) {
            await redis.del([...keysToDelete, trackingKey]);
        }
     return response.status(200).json({
 
         message:"Owner Home Updated successfully",
         OwnerHome:OwnerUpdateHome
 
     })
   } catch (error) {

    

    return response.status(500).json({
        message:"Failed to update Home "
    })
    
   }



}

const HomeDelete = async(request:Request,response:Response) => {

 const session = await mongoose.startSession();
  try {
      const { HomeID } = request.params as {
          HomeID:string;
      };
  
      const current_Owner = request.owner._id; 
      const trackingKey = `user_keys:${current_Owner}`;

      if(!mongoose.Types.ObjectId.isValid(HomeID)) return response.status(400).json( { message:"Invalid Home ID "})

    session.startTransaction()

  
      const OwnerHome = await HomeDB.findOne({
          _id:HomeID,
          owner:current_Owner,
      }).session(session);
  
    if(!OwnerHome){
        await session.abortTransaction();
        return response.status(404).json({ message:"Owner Home not found or unauthorized "})
        
    };
  
      await RoomDB.deleteMany({ home:HomeID }).session(session);
      await HomeDB.deleteOne({ _id:HomeID }).session(session);

      await session.commitTransaction();
      session.endSession()

      const keysToDelete = await redis.smembers(trackingKey);

      if(keysToDelete.length > 0){
        await redis.del([...keysToDelete,trackingKey]);

      }

     
  
      return response.status(200).json({
          message:"Home and all related rooms deleted successfully"
  
      })
  } catch (error) {
    if (session.inTransaction()) {
            await session.abortTransaction();
    }
    session.endSession();

    return response.status(500).json({
        message:"Failed to delete Home "
    })
    
  }


}





export {
    HomeLists,
    SingleHomeDetail,
    HomeUpdate,
    HomeDelete,
}