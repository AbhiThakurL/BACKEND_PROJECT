import { Request, Response } from "express";
import { HomeDB } from "../models/HomeIndex";
import { RoomDB } from "../models/RoomIndex";
import { Owner } from "../models/OwnerIndex";
import mongoose from "mongoose";
import { redis } from "../config/redius";

interface IRoomInput {
  name: string;
  floor: string;
}

const OwnerHomes = async (request: Request, response: Response) => {
  const session = await mongoose.startSession();

  try {
    const { address, state, zip , category ,rooms  } = request.body as {
      address: string;
      state: string;
      zip: string;
      category:"Rent" | "Sale" | "PG";
      rooms?: IRoomInput[];
    };

    const current_Owner = request.owner._id;
    const trackingKey = `user_keys:${current_Owner}`;

    if ([address, state, zip, category].some((field) => field?.trim() === "")){
      await session.endSession();
      return response
        .status(409)
        .json({ message: "address with state or zip code  required ." })};

    session.startTransaction();

    const ownerHome = await HomeDB.create([{
      address,
      state,
      zip,
      owner: current_Owner,
    }], { session });


    if(rooms && Array.isArray(rooms) && rooms.length > 0){
      
      const roomData = rooms.map((r) => ({ 

        name:r.name,
        floor:r.floor,
        home:ownerHome[0]._id


      }));

      const createdRooms = await RoomDB.insertMany(roomData, { session})
      const roomIds = createdRooms.map(r => r._id);

      await HomeDB.findByIdAndUpdate( ownerHome[0]._id,{
        $set: { rooms: roomIds }


      }).session(session)

    }

    await Owner.findByIdAndUpdate(request.owner._id, {
      $push: { homes: ownerHome[0]._id },
    }).session(session);

    await session.commitTransaction();
    session.endSession();

    const KeysToDelete = await redis.smembers(trackingKey);
    const profileCacheKey = `owner:profile:${current_Owner}`;

    if(KeysToDelete.length > 0) {

      await redis.del([ ...KeysToDelete, trackingKey , profileCacheKey])

    }


    return response.status(201).json({
      message: "Owner Home Create successfully",
      ownerHome:ownerHome[0],
    });
  } catch (error: unknown) {


  if (session.inTransaction()) await session.abortTransaction();
    session.endSession();
    return response.status(500).json({
      message: "Something went wrong ---V2",
      error
    });
  }
};

const OwnerRooms = async (request: Request, response: Response) => {
  
  const session = await mongoose.startSession();


  try {
    const { name, floor } = request.body;
    const { OwnerHomeID } = request.params;

    if (!name || !floor) {
      return response.status(400).json({
        message: "name and floor are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(OwnerHomeID)) {
      return response.status(400).json({
        message: "Invalid Home ID",
      });
    }

    session.startTransaction();

    const OwnerHome = await HomeDB.findOne({
      _id: OwnerHomeID,
      owner: request.owner._id,
    }).session(session);

    if (!OwnerHome) {

      session.endSession();

      return response.status(403).json({
        message: "You do not own this home or it does not exist",
      });
    }

    const OwnerRoom = await RoomDB.create([{
      name,
      floor,
      home: OwnerHomeID,
    }],{ session });

    await HomeDB.findByIdAndUpdate(OwnerHomeID, {
      $addToSet: { rooms: OwnerRoom[0]._id },
    }).session(session);

    await session.commitTransaction();
    session.endSession();

    const trackingKey = `user_keys:${request.owner._id}`;
    const keysToDelete = await redis.smembers(trackingKey);
    if (keysToDelete.length > 0) await redis.del([...keysToDelete, trackingKey]);



    return response.status(201).json({
      message: "Room created successfully",
      room: OwnerRoom,
    });
  } catch (error) {

   if (session.inTransaction()) await session.abortTransaction();
    session.endSession();

    return response.status(500).json({
      message: "Something went wrong",
    });
  }
};

const OwnerProfile = async (request: Request, response: Response) => {
  const current_owner = request.owner._id;
  const cacheKey = `owner:profile:${current_owner}`;

  const cachedProfile = await redis.get(cacheKey);

  if(cachedProfile) return response.status(200).json({ profile: JSON.parse(cachedProfile), source: "Redis" });

  

  const profile = await Owner.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(current_owner) } },

    // Lookup homes
    {
      $lookup: {
        from: "homedbs",
        localField: "_id",
        foreignField: "owner",
        as: "homes",
      },
    },

    // Add roomsCount for each home
    {
      $lookup: {
        from: "roomdbs",
        let: { homeId: "$homes._id" },
        pipeline: [
          { $match: { $expr: { $in: ["$home", "$$homeId"] } } },
          { $count: "count" },
        ],
        as: "roomsCountPerHome",
      },
    },

    // Total homes count
    {
      $addFields: {
        totalHomes: { $size: "$homes" },
      },
    },

    // Hide sensitive info
    {
      $project: {
        password: 0,
        refreshToken: 0,
      },
    },
  ]);
 
  if(profile.length > 0 ) {
    await redis.set(cacheKey,JSON.stringify(profile[0]),"EX",1800);
  }


  

  return response.status(201).json({
    message: "SuccessFully ",
    profile,
  });
};






export { OwnerHomes, OwnerRooms, OwnerProfile };
