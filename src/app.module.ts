import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { BethanyModule } from './bethany/bethany.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true, // deixa o ConfigModule disponível em todo o app
    }),
    UserModule,
    FirebaseModule,
    AuthModule,
    BethanyModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
