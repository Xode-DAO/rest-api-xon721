import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { TransactionService } from 'src/transaction/transaction.service';
import { MintNftDto } from './dto/mint-nft.dto';
import { TransferNftDto } from './dto/transfer-nft.dto';

@Injectable()
export class NftService {
  constructor(
    private readonly transactionService: TransactionService
  ) {}

  mintNFT(mintNftDto: MintNftDto) {
    const mintNFT = this.transactionService.mintNFT(mintNftDto);
    return mintNFT
  }

  getAllNFT(){
    const getAllNFT = this.transactionService.getAllNFT();
    return getAllNFT
  }

  getUserNFT(wallet_address: string){
    const getAllNFT = this.transactionService.getUserNFT(wallet_address);
    return getAllNFT
  }

  burnNFT(tokenID: number) {
    const burnNFT = this.transactionService.burnNFT(tokenID);
    return burnNFT
  }

  async transferNFT(transferNFTDto: TransferNftDto) {
    try {
      const getNFTOwner = await this.transactionService.getTokenOwer(transferNFTDto.id);

      if (!getNFTOwner) {
        throw new BadRequestException('Token not found.');
      }
      
      const transferNFT = this.transactionService.transferNFT(transferNFTDto);

      return transferNFT;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  async connectExtension(extension:string){

  }
}
