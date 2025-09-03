import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as ngrok from '@ngrok/ngrok';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
  });

  await app.listen(3000,'0.0.0.0');

  /* const listener = await ngrok.forward({ addr: 3000, authtoken_from_env: true });
  console.log(`🐱‍🏍  ngrok está online em: ${listener.url()}`); */
}
bootstrap();
