import { User } from "src/user/entities/user.entity";

export class LoginPayload{
    id:string;
    accessType:number;
    constructor(user:User){
        this.id = user.id;
        this.accessType = user.accessType;
    }
}