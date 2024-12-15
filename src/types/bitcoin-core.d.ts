declare module "bitcoin-core" {
  export interface ClientConstructorOptions {
    agentOptions?: any;
    headers?: boolean;
    host?: string;
    logger?: any;
    network?: string;
    password: string;
    port: number;
    ssl?: boolean;
    timeout?: number;
    username: string;
    version?: string;
    wallet?: string;
  }

  export class Client {
    constructor(options: ClientConstructorOptions);

    getBlockchainInfo(): Promise<{
      chain: string;
      blocks: number;
      headers: number;
      bestblockhash: string;
      difficulty: number;
      mediantime: number;
      verificationprogress: number;
      initialblockdownload: boolean;
      chainwork: string;
      size_on_disk: number;
      pruned: boolean;
    }>;

    getNewAddress(account?: string, addressType?: string): Promise<string>;
    estimateSmartFee(
      confTarget: number
    ): Promise<{ feerate: number; blocks: number }>;
    sendRawTransaction(txHex: string): Promise<string>;
    getRawTransaction(txId: string, verbose?: boolean): Promise<any>;
    getTransaction(txId: string): Promise<any>;
    listUnspent(
      minconf?: number,
      maxconf?: number
    ): Promise<
      Array<{
        txid: string;
        vout: number;
        address: string;
        label: string;
        scriptPubKey: string;
        amount: number;
        confirmations: number;
        spendable: boolean;
        solvable: boolean;
        desc: string;
        safe: boolean;
      }>
    >;
  }

  const client: Client;
  export default Client;
}
