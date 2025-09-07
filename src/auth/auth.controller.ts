import { Body, Controller, Get, Headers, Post, UnauthorizedException, UsePipes, ValidationPipe } from '@nestjs/common';
import { LoginDto } from './dtos/login.dto';
import { AuthService } from './auth.service';
import { ReturnLoginDto } from './dtos/returnLogin.dto';
import { UserId } from 'src/decorator /user-id.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post()
    @UsePipes(ValidationPipe)
    async login(@Body() loginDto: LoginDto): Promise<ReturnLoginDto> {
        return this.authService.login(loginDto);
    }

    @Get('check-token')
    checkToken(@Headers('Authorization') authHeader: string) {
        if (!authHeader) return { valid: false };
        try {
            const token = authHeader.replace('Bearer ', '');
            const userId = this.authService.verifyToken(token);
            return { valid: !!userId, userId };
        } catch {
            return { valid: false };
        }
    }

    @Get('check-access')
    async checkAccess(@Headers('Authorization') authHeader: string) {
        if (!authHeader) throw new UnauthorizedException();
        const token = authHeader.replace('Bearer ', '');
        const userId = this.authService.verifyToken(token);
        return this.authService.verifyUser(userId);
    }
}
