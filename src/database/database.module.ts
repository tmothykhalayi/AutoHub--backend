import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],

          // ✅ FORCE schema sync for first deploy
          synchronize: true, // <<< changed from !isProduction to true

          // ✅ Render-specific SSL for PostgreSQL
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          autoLoadEntities: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
