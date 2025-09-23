import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class MintNftDto {
    @ApiProperty({ description: 'NFT Name', example: 'NFT Name' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'NFT Description', example: 'This is nft description' })
    @IsString()
    description: string;

    @ApiProperty({ description: 'NFT data', example: 'NFT Data' })
    @IsString()
    data: string;
}