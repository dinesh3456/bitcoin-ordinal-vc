// src/types/verifiable-credential.ts

export interface IdentityCredentialSubject {
  id: string; // DID of the identity holder
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  documentType: "passport" | "nationalId" | "driverLicense";
  documentNumber: string;
  verificationLevel: "basic" | "advanced" | "expert";
  verificationDate: string;
  expirationDate: string;
}

export interface CredentialProof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  proofValue: string;
  nonce?: string;
}

export interface IdentityVerifiableCredential {
  "@context": string[];
  id: string;
  type: string[];
  issuer: {
    id: string;
    name: string;
    verifierType: "government" | "institution" | "organization";
  };
  issuanceDate: string;
  expirationDate: string;
  credentialSubject: IdentityCredentialSubject;
  proof?: CredentialProof;
  status?: {
    id: string;
    type: "RevocationList2020Status";
    revocationListIndex: string;
    revocationListCredential: string;
  };
}
