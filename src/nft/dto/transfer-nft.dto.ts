import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class TransferNftDto {
  @ApiProperty({
    description: 'Recipient wallet address',
    example: '5HTMTjSGYuT6QdhLcQVJ85hrJwNGeU8XuAYWrvyq8vUjBtSu',
  })
  @IsString()
  to: string;

  @ApiProperty({ description: 'Token ID', example: '1' })
  @IsString()
  id: string;
}