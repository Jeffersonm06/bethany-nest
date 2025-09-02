import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dtos/login.dto';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { compare } from 'bcrypt';
import { ReturnLoginDto } from './dtos/returnLogin.dto';
import { JwtService } from '@nestjs/jwt';
import { ReturnUserDto } from 'src/user/dto/return-user.dto';
import { LoginPayload } from './dtos/loginPayload';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService
  ) { }

  async login(loginDto: LoginDto): Promise<ReturnLoginDto> {
    const user = await this.userService.findUserByEmail(loginDto.email);

    if (!user) throw new NotFoundException("Email or password not exist");
    console.log(user)
    const isMatch = await compare(loginDto.password, user.password);
    if (!isMatch) throw new NotFoundException("Email or password not exist");

    const payload = new LoginPayload(user);

    return {
      accessToken: this.jwtService.sign({ ...payload }),
      user: new ReturnUserDto(user),
    };
  }

  async verifyUser(token: string): Promise<User> {
    let payload: any;

    try {
      payload = this.jwtService.verify(token);
    } catch (err) {
      throw new UnauthorizedException('Token inválido');
    }

    const user = await this.userService.findOne(payload.id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  verifyToken(token: string): string {
    try {
      const decoded = this.jwtService.verify(token);
      return decoded.id;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
