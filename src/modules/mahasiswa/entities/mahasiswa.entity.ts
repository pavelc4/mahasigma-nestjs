import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Mahasiswa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nim: string;

  @Column()
  nama: string;

  @Column()
  prodi: string;

  @Column()
  fakultas: string;

  @Column({ default: true })
  isActive: boolean;
}
