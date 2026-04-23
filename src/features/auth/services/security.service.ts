import * as Crypto from 'expo-crypto';

export async function hashSecret(value: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

export async function matchesSecret(value: string, hash: string) {
  const candidateHash = await hashSecret(value);
  return candidateHash === hash;
}
