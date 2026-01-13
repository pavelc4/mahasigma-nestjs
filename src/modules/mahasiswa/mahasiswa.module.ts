import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MahasiswaService } from './mahasiswa.service';
import { MahasiswaController } from './mahasiswa.controller';
import { Mahasiswa } from './entities/mahasiswa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mahasiswa])],
  controllers: [MahasiswaController],
  providers: [MahasiswaService],
})
export class MahasiswaModule {}
