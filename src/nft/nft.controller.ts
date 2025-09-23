import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { NftService } from './nft.service';
import { MintNftDto } from './dto/mint-nft.dto';
import { ApiBody, ApiParam } from '@nestjs/swagger';
import { TransferNftDto } from './dto/transfer-nft.dto';
import { web3FromAddress } from '@polkadot/extension-dapp';

@Controller('nft')
export class NftController {
  constructor(private readonly nftService: NftService) {}

  @Post('mint')
  @ApiBody({ type: MintNftDto })
  mintNFT(@Body() mintNftDto: MintNftDto) {
    return this.nftService.mintNFT(mintNftDto);
  }

  @Get()
  getAllNFT() {
    return this.nftService.getAllNFT();
  }

  @Get(':wallet_address')
  @ApiParam({ name: 'wallet_address', type: String, description: 'Wallet address of the user' })
  getUserNFT(@Param('wallet_address') wallet_address: string) {
    return this.nftService.getUserNFT(wallet_address);
  }

  @Delete('burn/:tokenID')
  @ApiParam({ name: 'tokenID', type: Number, description: 'Token ID of the NFT to burn' })
  burnNFT(@Param('tokenID') tokenID: number) {
    return this.nftService.burnNFT(tokenID);
  }

  @Patch('transfer')
  @ApiBody({ type: TransferNftDto })
  async transferNFT(@Body() transferNFTDto: TransferNftDto) {
    
    return this.nftService.transferNFT(transferNFTDto);
  }
}
