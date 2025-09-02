import { ReturnUserDto } from "src/user/dto/return-user.dto";

export interface ReturnLoginDto{
    user:ReturnUserDto;
    accessToken:string;
}