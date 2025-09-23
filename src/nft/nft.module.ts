import { Module } from '@nestjs/common';
import { NftService } from './nft.service';
import { NftController } from './nft.controller';
import { TransactionService } from 'src/transaction/transaction.service';
import { TxService } from 'src/tx/tx.service';

@Module({
  controllers: [NftController],
  providers: [NftService,TransactionService, TxService],
})
export class NftModule {}
