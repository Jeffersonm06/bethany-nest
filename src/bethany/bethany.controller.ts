import { Controller, Post, Body, NotFoundException, Get, UseInterceptors, UploadedFile } from '@nestjs/common';
import { Bethany, Message } from './bethany.service';
import { UserId } from 'src/decorator /user-id.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

export class ChatDto {
  message: string;
}

@Controller('bethany')
export class BethanyController {
  constructor(private readonly bethanyService: Bethany) { }

  @Post('chat')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async sendMessage(
    @UploadedFile() file: Express.Multer.File,
    @Body('message') message: string,
    @Body('type') typeMsg: Message['type'],
    @UserId() userId: string
  ) {
    console.log(message, userId, file, typeMsg)
    const response = await this.bethanyService.sendMessage(message, userId, file, typeMsg);

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
