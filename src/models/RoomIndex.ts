import mongoose, { Schema, Document, Types } from "mongoose";

export interface RoomDocument extends Document {
  name: string;
  floor: string;
  home: Types.ObjectId;
}

const roomSchema = new Schema<RoomDocument>(
  {
    name: { type: String, required: true },
    floor: { type: String, required: true },

    home: {
      type: Types.ObjectId,
      ref: "HomeDB",
      required: true
    }
  },
  { timestamps: true }
);

export const RoomDB = mongoose.model<RoomDocument>("RoomDB", roomSchema);
