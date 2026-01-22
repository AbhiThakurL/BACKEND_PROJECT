import { Request,Response } from "express";
import mongoose from "mongoose";
import { RoomDB } from "../../models/RoomIndex";
import { HomeDB } from "../../models/HomeIndex";
import { redis } from "../../config/redius";


const OwnerUpdateRoom = async (request:Request,response:Response) => {

  try {
      const { RoomID } = request.params as {
          RoomID:string;
      };
      const current_owner = request.owner._id;
      const { name , floor } = request.body as {
  
          name:string;
          floor:string;
  
      };
  
      if(!mongoose.Types.ObjectId.isValid(RoomID)) return response.status(400).json({ message: "Invalid Owner room ID "})
      
      const OwnerRooms = await RoomDB.findById(RoomID);
  
      if(!OwnerRooms) return response.status(404).json({ message:"Owner Rooms not founds ."})
  
  
      const OwnerHomes = await HomeDB.exists({
  
          _id:OwnerRooms.home,
          owner:current_owner,
  
      });
  
      if(!OwnerHomes) return response.status(403).json({ message: "You do not have permission to update this room", })
  
      
     const updatedRoom = await RoomDB.findByIdAndUpdate(
      RoomID,
      { $set: { ...(name && { name }), ...(floor && { floor }) } },
      { new: true }
    );
    
    const trackingKey = `user_keys:${current_owner}`;
    const keysToDelete = await redis.smembers(trackingKey)

    if (keysToDelete.length > 0) await redis.del([...keysToDelete, trackingKey]);
  
      return response.status(200).json({
        message: "Room updated successfully",
        room: updatedRoom,
      });
  } catch (error) {

    console.error("Update room error:", error);
    return response.status(500).json({
      message: "Failed to update room",
    });
    
  }


}


const OwnerDeleteRoom = async(request:Request,response:Response) => {

    const session = await mongoose.startSession();
try {
    
        const { RoomID } = request.params;
        const current_Owner = request.owner._id;
    
        if(!mongoose.Types.ObjectId.isValid(RoomID)) return response.status(400).json({ message:"Invalid Owner Room ID "})
        
        session.startTransaction();
    
        const OwnerRoom = await RoomDB.findById(RoomID).session(session)
        if(!OwnerRoom){
            await session.abortTransaction();
            return response.status(404).json({ 
                message:"Room not founds ."
            })
        }
    
        const OwnerHomes = await HomeDB.findOne({
            _id:OwnerRoom.home,
            owner:current_Owner,
        }).session(session);
    
        if(!OwnerHomes) {
            await session.abortTransaction();
            return response.status(403).json({
                message:"You do not have permission to delete this room"
            })
        };
    
    
         await HomeDB.updateOne(
          { _id: OwnerRoom.home },
          { $pull: { rooms: OwnerRoom._id } }
        ).session(session);
    
        await RoomDB.deleteOne({ _id: RoomID }).session(session);
        await session.commitTransaction();
        session.endSession()

        const trackingKey = `user_keys:${current_Owner}`;
        const profileCacheKey = `owner:profile:${current_Owner}`;
        const keysToDelete = await redis.smembers(trackingKey);

        if (keysToDelete.length > 0) {
         await redis.del([...keysToDelete, trackingKey, profileCacheKey]);
        } else {
            await redis.del(profileCacheKey);
        }
    
         return response.status(200).json({
          message: "Room deleted successfully",
        });
    
} catch (error) {

 if (session.inTransaction()) await session.abortTransaction();
    session.endSession();

    return response.status(500).json({
      message: "Failed to delete room",
    });

    
}


}


export {
    OwnerUpdateRoom,
    OwnerDeleteRoom,

}