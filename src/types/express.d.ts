import { OwnerDocument } from "../models/OwnerIndex";

declare global {
  namespace Express {
    interface Request {
      owner?: OwnerDocument;
    }
  }
}

export {};
