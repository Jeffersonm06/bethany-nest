import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { BethanyModule } from './bethany/bethany.module';

@Module({
  imports: [
    UserModule,
    FirebaseModule,
    AuthModule,
    BethanyModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
