import { Controller, Post, Body, NotFoundException, Get } from '@nestjs/common';
import { Bethany } from './bethany.service';
import { UserId } from 'src/decorator /user-id.decorator';

export class ChatDto {
  message: string;
}

@Controller('bethany')
export class BethanyController {
  constructor(private readonly bethanyService: Bethany) { }

  @Post('chat')
  async sendMessage(@Body('message') message: string, @UserId() userId: string) {
    console.log('Mensagem recebida do front:', message);

    if (!message || !message.trim()) {
      return { error: 'Mensagem vazia' };
    }

    const response = await this.bethanyService.sendMessage(message, userId);
    return { message: response };
  }

  @Get('history')
  async getHistory(@UserId() userId: string, limit: number = 20) {
    if (!userId) {
      throw new NotFoundException('O usuário deve estar logado!')
    }

    return this.bethanyService.getUserMessages(userId, limit)
  }

}
