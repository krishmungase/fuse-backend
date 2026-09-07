import { User as DbUser } from "../app/user/schema/user.schema";

declare global {
  namespace Express {
    interface User extends Omit<DbUser, "hashPassword"> {
      id: string;
    }
  }
}

export {};
