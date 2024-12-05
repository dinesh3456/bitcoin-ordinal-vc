interface Config {
  bitcoin: {
    network: string;
    nodeUrl: string;
    rpcUser: string;
    rpcPassword: string;
  };
  ordinal: {
    inscriptionSize: number;
    minSats: number;
  };
}

export const config: Config = {
  bitcoin: {
    network: process.env.BITCOIN_NETWORK || "testnet",
    nodeUrl: process.env.BITCOIN_NODE_URL || "http://localhost:8332",
    rpcUser: process.env.BITCOIN_RPC_USER || "",
    rpcPassword: process.env.BITCOIN_RPC_PASSWORD || "",
  },
  ordinal: {
    inscriptionSize: 1000, // Maximum size in bytes
    minSats: 1000, // Minimum satoshis per inscription
  },
};

// VC Types
export interface VerifiableCredential {
  "@context": string[];
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: Record<string, any>;
  proof?: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
  };
}
