import { Module } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from './firebase.service';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      useFactory: () => {
        if (!admin.apps.length) {
          const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
          if (!serviceAccount) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT não configurado nas variáveis de ambiente!');
          }
          admin.initializeApp({
            credential: admin.credential.cert(
              JSON.parse(serviceAccount)
            ),
            databaseURL: 'https://bethany-ai-default-rtdb.firebaseio.com',
          });
        }
        return admin;
      },
    },
    FirebaseService,
  ],
  exports: [FirebaseService],
})
export class FirebaseModule { }
