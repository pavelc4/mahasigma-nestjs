import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './common/database/database.module';
import { MahasiswaModule } from './modules/mahasiswa/mahasiswa.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    MahasiswaModule,
    HealthModule,
  ],
})
export class AppModule {}
