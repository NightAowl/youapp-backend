import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsOptional,
  IsNumber,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfileDto {
  @ApiProperty({
    example: '60d5ecb74f421c001f3d9f4b',
    description: 'The ID of the user',
  })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'male', description: 'The gender of the user' })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({
    example: '1990-01-01',
    description: 'The birthday of the user',
  })
  @IsDate()
  @IsNotEmpty()
  birthday: Date;

  @ApiProperty({
    example: 180,
    description: 'The height of the user in cm',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiProperty({
    example: 75,
    description: 'The weight of the user in kg',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiProperty({
    example: 'http://example.com/image.jpg',
    description: 'The profile image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiProperty({
    example: ['reading', 'sports'],
    description: 'The interests of the user',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interest?: string[];
}
