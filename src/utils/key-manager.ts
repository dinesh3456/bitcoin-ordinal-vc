// src/utils/key-manager.ts
import * as bitcoin from "bitcoinjs-lib";
import { BIP32Factory } from "bip32";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory, ECPairAPI } from "ecpair";

const bip32 = BIP32Factory(ecc);
const ECPair: ECPairAPI = ECPairFactory(ecc);

class CustomSigner implements bitcoin.Signer {
  private ecPair: ReturnType<typeof ECPair.fromPrivateKey>;
  publicKey: Buffer;

  constructor(ecPair: ReturnType<typeof ECPair.fromPrivateKey>) {
    this.ecPair = ecPair;
    this.publicKey = Buffer.from(ecPair.publicKey);
  }

  sign(hash: Buffer): Buffer {
    const signature = this.ecPair.sign(hash);
    return Buffer.from(signature);
  }
}

export class KeyManager {
  private network: bitcoin.Network;
  private masterNode: ReturnType<typeof bip32.fromSeed>;

  constructor(network: bitcoin.Network, seed?: Buffer) {
    this.network = network;

    if (!seed) {
      seed = Buffer.from(
        bitcoin.crypto.sha256(Buffer.from(Date.now().toString()))
      );
    }

    this.masterNode = bip32.fromSeed(seed, this.network);
  }

  getKeyPair(index: number = 0): bitcoin.Signer {
    const child = this.masterNode.derive(index);
    const ecPair = ECPair.fromPrivateKey(child.privateKey!, {
      network: this.network,
    });

    return new CustomSigner(ecPair);
  }

  async signPsbt(psbt: bitcoin.Psbt, inputIndex: number = 0): Promise<void> {
    const keyPair = this.getKeyPair(inputIndex);
    psbt.signInput(inputIndex, keyPair);
  }

  getPublicKey(index: number = 0): Buffer {
    return this.getKeyPair(index).publicKey;
  }

  static generateSeed(): Buffer {
    return Buffer.from(
      bitcoin.crypto.sha256(Buffer.from(Date.now().toString()))
    );
  }
}
