import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ViewMessagesDto {
  @ApiProperty({
    example: '60d5ecb74f421c001f3d9f4b',
    description: 'The ID of the message sender',
  })
  @IsNotEmpty()
  senderId: string;

  @ApiProperty({
    example: '60d5ecb74f421c001f3d9f4c',
    description: 'The ID of the message receiver',
  })
  @IsNotEmpty()
  receiverId: string;
}
