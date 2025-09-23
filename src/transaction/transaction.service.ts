import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { response } from 'express';
import { MintNftDto } from 'src/nft/dto/mint-nft.dto';
import { TransferNftDto } from 'src/nft/dto/transfer-nft.dto';
import { TxService } from 'src/tx/tx.service';

@Injectable()
export class TransactionService implements OnModuleInit {
  private contractAddress: string;
  private contractOwner: string;
  private ownerSeed: string;
  private instance: {
    contractAddress: string;
    contractOwner: string;
    ownerSeed: string;
    REFTIME: number;
    PROOFSIZE: number;
  };
  private owner: ReturnType<Keyring['addFromUri']>;
  private readonly storageDepositLimit = null;

  constructor(private readonly txService: TxService) {}

  /**
   * Runs when module is initialized
   */
  async onModuleInit() {
    // ✅ Ensure WASM crypto is ready
    await cryptoWaitReady();

    // Load env vars
    this.contractAddress = process.env.contractAddress!;
    this.contractOwner = process.env.contractOwner!;
    this.ownerSeed = process.env.ownerSeed!;

    if (!this.contractAddress || !this.contractOwner || !this.ownerSeed) {
      throw new Error('Required environment variables are missing');
    }

    // Prepare instance config
    this.instance = {
      contractAddress: this.contractAddress,
      contractOwner: this.contractOwner,
      ownerSeed: this.ownerSeed,
      REFTIME: 300000000000,
      PROOFSIZE: 500000,
    };

    // ✅ Initialize Keyring owner after crypto is ready
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 0 });
    this.owner = keyring.addFromUri(this.ownerSeed);
  }


  async mintNFT(mintNftDto: MintNftDto) {
    const contract = await this.txService.getContract(this.contractAddress);
    if (!contract) {
      throw new Error('Contract not initialized!');
    }

    return this.txService.sendContractTransaction(
      contract,
      'mint',
      this.owner,
      [
        mintNftDto.name,
        mintNftDto.description,
        mintNftDto.data,
      ],
      this.instance,
      this.storageDepositLimit,
    );
  }

  async getAllNFT() {
    const contract = await this.txService.getContract(this.contractAddress);
    if (!contract) {
      throw new Error('Contract not initialized!');
    }

    const result = await this.txService.sendContractQuery(
      contract,
      'getAllNfts',
      [],
      this.instance,
    );
    const data = {
      ...response,
    }

    if(result?.ok){
      return result.ok
    }else{
      return Error("Token not found");
    }
  }

  async burnNFT(id:number) {
    const contract = await this.txService.getContract(this.contractAddress);
    if (!contract) {
      throw new Error('Contract not initialized!');
    }
    
    return this.txService.sendContractTransaction(
      contract,
      'burn',
      this.owner,
      [id],
      this.instance,
      this.storageDepositLimit,
    );
  }

  async getUserNFT(owner:string) {
    const contract = await this.txService.getContract(this.contractAddress);
    if (!contract) {
      throw new Error('Contract not initialized!');
    }

    const result = await this.txService.sendContractQuery(
      contract,
      'getUserNfts',
      [owner],
      this.instance,
    );
    const data = {
      ...response,
    }

    if(result?.ok){
      return result.ok
    }else{
      return Error("Token not found");
    }
  }

  async transferNFT(transferNFTDto:TransferNftDto) {
    const contract = await this.txService.getContract(this.contractAddress);
    if (!contract) {
      throw new Error('Contract not initialized!');
    }
    
    return this.txService.signContractTrnasaction(
      contract,
      'transfer',
      this.owner,
      [
        transferNFTDto.to,
        transferNFTDto.id
      ],
      this.instance,
      this.storageDepositLimit,
    );
  }

  async getTokenOwer(TokenId:string){
    const contract = await this.txService.getContract(this.contractAddress);
    if (!contract) {
      throw new Error('Contract not initialized!');
    }
      const result = await this.txService.sendContractQuery(
        contract,
        'ownerOf',
        [TokenId],
        this.instance,
      );

      if(result?.ok == null){
        throw new BadRequestException("Token not found");
      }else if(result?.ok){
        return result?.ok
      }else{
        throw new Error("Error");
     }
  } 

}
