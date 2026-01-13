import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMahasiswaDto } from './dto/create-mahasiswa.dto';
import { UpdateMahasiswaDto } from './dto/update-mahasiswa.dto';
import { Mahasiswa } from './entities/mahasiswa.entity';

@Injectable()
export class MahasiswaService {
  constructor(
    @InjectRepository(Mahasiswa)
    private readonly repo: Repository<Mahasiswa>,
  ) {}

  async create(dto: CreateMahasiswaDto) {
    const data = this.repo.create(dto);
    return await this.repo.save(data);
  }

  async findAll() {
    return await this.repo.find();
  }

  async findOne(id: string) {
    const data = await this.repo.findOneBy({ id });
    if (!data) throw new NotFoundException(`ID ${id} tidak ditemukan`);
    return data;
  }

  async update(id: string, dto: UpdateMahasiswaDto) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.repo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`ID ${id} tidak ditemukan`);
    return { message: 'Berhasil dihapus' };
  }
}
