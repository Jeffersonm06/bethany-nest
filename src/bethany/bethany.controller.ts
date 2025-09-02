// bethany.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { Bethany } from './bethany.service';
import { UserId } from 'src/decorator /user-id.decorator';

interface ChatDto {
  userId?: string; // opcional se quiser identificar o usuário
  message: string;
}

@Controller('bethany')
export class BethanyController {
  constructor(private readonly bethanyService: Bethany) {}

  @Post('chat')
  async sendMessage(@Body() body: ChatDto, @UserId() userId:string) {
    console.log(body)
    const { message } = body;

    if (!message || !message.trim()) {
      return { error: 'Mensagem vazia' };
    }

    const responseText = await this.bethanyService.sendMessage(message, userId);

    return { message: responseText };
  }
}
