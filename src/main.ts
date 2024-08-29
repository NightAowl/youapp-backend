import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('api');

    app.useWebSocketAdapter(new IoAdapter(app));

    app.enableCors();

    const config = new DocumentBuilder()
      .setTitle('YouApp API')
      .setDescription('API documentation for YouApp backend')
      .setVersion('1.0')
      .addTag('auth')
      .addTag('profile')
      .addTag('chat')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();

    await app.listen(3000);

    logger.log(`Application is running on: ${await app.getUrl()}`);
    logger.log(
      `Swagger documentation is available at: ${await app.getUrl()}/api/docs`,
    );
  } catch (error) {
    logger.error('Error during application bootstrap', error.stack);
    process.exit(1);
  }
}

bootstrap();
