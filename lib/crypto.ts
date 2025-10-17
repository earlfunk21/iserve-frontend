// Ensure a secure PRNG is available in React Native environments before using tweetnacl
// This polyfills global.crypto.getRandomValues
import "react-native-get-random-values";
import { Buffer } from "buffer";
global.Buffer = Buffer;

// tweetnacl-group-e2ee.ts
import pako from "pako";
import nacl from "tweetnacl";
import util from "tweetnacl-util";

/**
 * Helper encode/decode utilities (Base64 + UTF8)
 */
const encodeBase64 = (u8: Uint8Array) => util.encodeBase64(u8);
const decodeBase64 = (s: string) => util.decodeBase64(s);

/**
 * Key pair structure (base64 encoding for transport/storage)
 */
type KeyPairB64 = {
  publicKey: string; // base64
  secretKey: string; // base64
};

/**
 * Message envelope structure that you can store/send
 */
type EncryptedForRecipient = {
  recipientPublicKey: string; // base64 (recipient's public key)
  encryptedSymmetricKey: string; // base64 (nacl.box output)
  keyNonce: string; // base64 (nonce used to encrypt symmetric key)
};

type MessageEnvelope = {
  senderPublicKey: string; // base64
  // secretbox ciphertext + nonce (secretbox uses symmetric key)
  ciphertext: string; // base64
  ciphertextNonce: string; // base64
  // list of per-recipient encrypted symmetric keys
  recipients: EncryptedForRecipient[];
};

/**
 * Generate a Curve25519 keypair (nacl.box.keyPair)
 */
export function generateKeyPair(): KeyPairB64 {
  const kp = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(kp.publicKey),
    secretKey: encodeBase64(kp.secretKey),
  };
}

/**
 * Hybrid encrypt a message for multiple recipients.
 *
 * Steps:
 * 1. generate a random symmetricKey (32 bytes)
 * 2. secretbox (XSalsa20+Poly1305) encrypt the plaintext -> ciphertext + nonce
 * 3. for each recipient, encrypt the symmetricKey using nacl.box with (recipientPublicKey, senderSecretKey) -> encryptedSymmetricKey + nonce
 *
 * Return a MessageEnvelope (JSON-serializable).
 */
export async function encryptForRecipients(
  plaintext: string,
  senderKeyPair: KeyPairB64,
  recipientsPublicKeysB64: string[] // array of base64 public keys
) {
  // 1. symmetric key
  const symmetricKey = nacl.randomBytes(nacl.secretbox.keyLength); // 32 bytes

  // 2. secretbox encrypt the plaintext
  const msgBytes = util.decodeUTF8(plaintext);
  const ciphertextNonce = nacl.randomBytes(nacl.secretbox.nonceLength); // 24 bytes
  const ciphertext = nacl.secretbox(msgBytes, ciphertextNonce, symmetricKey);

  // 3. encrypt symmetricKey for each recipient using nacl.box (senderSecret + recipientPub)
  const recipients: EncryptedForRecipient[] = [];

  const senderSecretKey = decodeBase64(senderKeyPair.secretKey);
  // sender's public key (include for recipients to verify which sender encrypted it)
  const senderPublicKey = senderKeyPair.publicKey;

  for (const recipPubB64 of recipientsPublicKeysB64) {
    const recipPub = decodeBase64(recipPubB64);

    const keyNonce = nacl.randomBytes(nacl.box.nonceLength); // 24 bytes
    // nacl.box expects (message, nonce, recipientPublicKey, senderSecretKey)
    const encryptedSymmetricKey = nacl.box(
      symmetricKey,
      keyNonce,
      recipPub,
      senderSecretKey
    );

    recipients.push({
      recipientPublicKey: recipPubB64,
      encryptedSymmetricKey: encodeBase64(encryptedSymmetricKey),
      keyNonce: encodeBase64(keyNonce),
    });
  }

  const envelope: MessageEnvelope = {
    senderPublicKey,
    ciphertext: encodeBase64(ciphertext),
    ciphertextNonce: encodeBase64(ciphertextNonce),
    recipients,
  };

  const compressed = pako.deflate(JSON.stringify(envelope));
  const compressedB64 = Buffer.from(compressed).toString("base64");

  return compressedB64;
}

/**
 * Decrypt an envelope for a recipient.
 *
 * Steps:
 * 1. find the correct EncryptedForRecipient entry that matches this recipient's public key
 * 2. use nacl.box.open(encryptedSymmetricKey, keyNonce, senderPublicKey, recipientSecretKey) to recover symmetricKey
 * 3. use nacl.secretbox.open(ciphertext, ciphertextNonce, symmetricKey) to recover plaintext
 */
export async function decryptEnvelope(
  compressedB64: string,
  recipientKeyPair: KeyPairB64
) {
  const envelope = JSON.parse(
    pako.inflate(Buffer.from(compressedB64, "base64"), { to: "string" })
  ) as MessageEnvelope;
  const recipientPublicKeyB64 = recipientKeyPair.publicKey;
  const recipientSecretKey = decodeBase64(recipientKeyPair.secretKey);

  // find recipient entry
  const recipientEntry = envelope.recipients.find(
    (r) => r.recipientPublicKey === recipientPublicKeyB64
  );
  if (!recipientEntry) {
    throw new Error(
      "This message is not encrypted for this recipient (no matching recipient key)."
    );
  }

  // decode fields
  const encryptedSymmetricKey = decodeBase64(
    recipientEntry.encryptedSymmetricKey
  );
  const keyNonce = decodeBase64(recipientEntry.keyNonce);
  const senderPublicKey = decodeBase64(envelope.senderPublicKey);

  // open box to get symmetric key
  const symmetricKey = nacl.box.open(
    encryptedSymmetricKey,
    keyNonce,
    senderPublicKey,
    recipientSecretKey
  );
  if (!symmetricKey) {
    throw new Error(
      "Failed to open symmetric key — possible key mismatch or tampering."
    );
  }

  // open secretbox (message)
  const ciphertext = decodeBase64(envelope.ciphertext);
  const ciphertextNonce = decodeBase64(envelope.ciphertextNonce);

  const plaintextBytes = nacl.secretbox.open(
    ciphertext,
    ciphertextNonce,
    symmetricKey
  );
  if (!plaintextBytes) {
    throw new Error("Failed to decrypt message body — tampering or wrong key.");
  }

  const plaintext = util.encodeUTF8(plaintextBytes);

  return plaintext;
}
