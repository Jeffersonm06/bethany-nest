// chat.module.ts
import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { Bethany } from './bethany.service';
import { BethanyController } from './bethany.controller';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports:[
    FirebaseModule,
    UserModule
  ],
  providers: [ChatGateway, Bethany],
  controllers:[BethanyController]
})
export class BethanyModule {}
