import { User } from "../entities/user.entity";

export class ReturnUserDto {
    username: string;
    email: string;
    constructor(user:User){
        this.username = user.username;
        this.email = user.email;
    }
}
