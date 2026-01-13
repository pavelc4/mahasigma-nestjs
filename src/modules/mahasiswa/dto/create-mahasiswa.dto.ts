import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateMahasiswaDto {
  @IsNotEmpty()
  @IsString()
  nim: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  nama: string;

  @IsNotEmpty()
  @IsString()
  prodi: string;

  @IsNotEmpty()
  @IsString()
  fakultas: string;
}
