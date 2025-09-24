// tx.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import * as abi from '../smart-contract/xode_xon721.json';

@Injectable()
export class TxService implements OnModuleInit {
  private api: ApiPromise;

  async onModuleInit() {
    const wsProviderUrl = process.env.WS_PROVIDER;

    if (!wsProviderUrl) {
      throw new Error('Missing WS_PROVIDER in .env');
    }

    const wsProvider = new WsProvider(wsProviderUrl);
    this.api = await ApiPromise.create({ provider: wsProvider });

    Logger.log(`Polkadot API initialized with ${wsProviderUrl}`);
  }

  async getContract(contractAddress: string) {
    if (!this.api) throw new Error('API not initialized');
    return new ContractPromise(this.api, abi, contractAddress);
  }
    sendContractTransaction = async (
        contract: any,
        method: string,
        owner: any,
        params: any[],
        instance: any,
        storageDepositLimit: null
        ) => {
        return new Promise(async (resolve, reject) => {
            try {
                const dryRunResult: any = await this.dryRunContract(
                    contract,
                    method,
                    owner,
                    params,
                    instance,
                    storageDepositLimit
                );

                if (dryRunResult instanceof Error) {
                    return reject(dryRunResult);
                }

                const { gasRequired, storageDeposit } = dryRunResult;
                const tx = contract.tx[method](
                {
                    storageDepositLimit: storageDepositLimit,
                    gasLimit: this.api.registry.createType('WeightV2', {
                        refTime: gasRequired.refTime.toBn(),
                        proofSize: gasRequired.proofSize.toBn(),
                    }),
                },
                ...params
                );

                await tx.signAndSend(owner, { nonce: -1 }, async (result: any) => {
                    if (result.dispatchError) {
                        if (result.dispatchError?.isModule) {
                            const decoded = this.api.registry.findMetaError(result.dispatchError.asModule);
                            console.error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`);
                            reject(`${decoded.section}.${decoded.name}`);
                        } else {
                            console.error(result.dispatchError.toString());
                            reject(result.dispatchError.toString());
                        }
                        } else if (result.status.isInBlock) {
                        resolve({
                            status: 200,
                            message: `${method} included in block`,
                            data: {
                            isFinalized: result.status.isFinalized,
                            blockHash: result.status.asInBlock.toHex(),
                            },
                        });
                    }
                });
            } catch (error) {
            reject(error);
            }
        });
    };


    dryRunContract = async (
        contract: any,
        method: string,
        owner: any,
        params: any[],
        instance: any,
        storageDepositLimit: any
    ) => {
        try {
        const caller = typeof owner === 'string' ? owner : owner.address;
        if (!caller) {
            throw new Error('Invalid caller: expected KeyringPair or SS58 string');
        }

        const { gasRequired, storageDeposit, result, output } =
            await contract.query[method](
                caller,
                {
                gasLimit: this.api.registry.createType('WeightV2', {
                    refTime: instance.REFTIME,
                    proofSize: instance.PROOFSIZE,
                }),
                storageDepositLimit,
                },
                ...params
            );
            
            if (result.isErr) {
                if (result.asErr.isModule) {
                    const dispatchError = this.api.registry.findMetaError(result.asErr.asModule);
                    console.error(`DryRun failed: ${dispatchError.section}.${dispatchError.name} - ${dispatchError.docs.join(' ')}`);
                    return Error(`${dispatchError.section}.${dispatchError.name}`);
                } else {
                    return Error(result.asErr.toString());
                }
            }

            // ✅ return raw values (no .toHuman())
            return {
                gasRequired,
                storageDeposit,
                result,
                output,
            };
        } catch (error: any) {
            return Error(error);
        }
    };

    sendContractQuery = async(
        contract:any,
        method:any,
        params:any,
        instance: any
    ) => {
        try{
            const gasLimit = this.api.registry.createType(
                'WeightV2',
                this.api.consts.system.blockWeights['maxBlock']
            );
            const { output } = await contract.query[method](
                instance.contractAddress,
                { gasLimit: gasLimit },
                ...params
            );
            return output?.toJSON();
        }catch(error){
            return Error(error);
        }
    }
    executeExtrinsic = async(
        executeExtrinsic: any,
        rawExtrinsic: any
    ) => {
                return new Promise(async (resolve, reject) => {
            try {
                const dryRunResult = await this.dryRunExtrinsic(rawExtrinsic);
                if (!dryRunResult) {
                    reject(dryRunResult);
                }
                await await executeExtrinsic.send(async (result: any) => {
                    if (result.dispatchError) {
                        if (result.dispatchError.isModule) {
                            const decoded = this.api.registry.findMetaError(result.dispatchError.asModule);
                            const { docs, name, section } = decoded;
                            reject(`${section}.${name}: ${docs.join(' ')}`);
                        } else {
                            console.log(result.dispatchError.toString());
                            reject(result.dispatchError.toString());
                        }
                    } else if (result.status.isInBlock) {
                        resolve({
                            status: 200,
                            message: `Transaction in block`,
                            data: {
                                isFinalized: result.status.isFinalized,
                                blockHash: result.status.asInBlock.toHex(),
                            },
                        });
                    } 
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    dryRunExtrinsic = async(
        rawExtrinsic: any
    ) => {
        try{
            return await this.api.rpc.system.dryRun(rawExtrinsic);
        } catch(error:any){
            return Error(error);
        }
    }

    async signContractTrnasaction(
        contract: any,
        method: string,
        owner: any,
        params: any[],
        instance: any,
        storageDepositLimit: null,
        signer?: any,
    ) {
        return new Promise(async (resolve, reject) => {
        try {
            
            const dryRunResult: any = await this.dryRunContract(
                contract,
                method,
                owner,
                params,
                instance,
                storageDepositLimit,
            );

            if (dryRunResult instanceof Error) {
            return reject(dryRunResult);
            }

            const { gasRequired } = dryRunResult;

            const tx = contract.tx[method](
            {
                storageDepositLimit,
                gasLimit: this.api.registry.createType('WeightV2', {
                refTime: gasRequired.refTime.toBn(),
                proofSize: gasRequired.proofSize.toBn(),
                }),
            },
            ...params,
            );

            await tx.signAndSend(owner, { signer, nonce: -1 }, (result: any) => {
                if (result.dispatchError) {
                    if (result.dispatchError?.isModule) {
                        const decoded = this.api.registry.findMetaError(
                        result.dispatchError.asModule,
                    );
                        reject(`${decoded.section}.${decoded.name}`);
                    } else {
                        reject(result.dispatchError.toString());
                    }
                } else if (result.status.isInBlock) {
                    resolve({
                        status: 200,
                        message: `${method} included in block`,
                        data: {
                            isFinalized: result.status.isFinalized,
                            blockHash: result.status.asInBlock.toHex(),
                        },
                    });
                }
            });
        } catch (error) {
            reject(error);
        }
        });
    }

    
}
