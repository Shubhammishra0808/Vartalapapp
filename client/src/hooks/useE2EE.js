import { useState, useEffect, useCallback } from 'react';
import { chatService } from '../services/chatService';

// ArrayBuffer to Base64
const buf2b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
// Base64 to ArrayBuffer
const b642buf = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;

export const useE2EE = (currentUser) => {
  const [keyPair, setKeyPair] = useState(null);
  const [fingerprint, setFingerprint] = useState('');

  useEffect(() => {
    const initKeys = async () => {
      if (!window.crypto || !window.crypto.subtle) return;

      let storedPriv = localStorage.getItem('securechat_e2ee_priv');
      let storedPub = localStorage.getItem('securechat_e2ee_pub');

      if (!storedPriv || !storedPub) {
        // Generate ECDH P-256 Keypair
        const pair = await window.crypto.subtle.generateKey(
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          ['deriveKey', 'deriveBits']
        );

        const exportedPub = await window.crypto.subtle.exportKey('raw', pair.publicKey);
        const exportedPriv = await window.crypto.subtle.exportKey('jwk', pair.privateKey);

        const pubBase64 = buf2b64(exportedPub);
        const privJson = JSON.stringify(exportedPriv);

        localStorage.setItem('securechat_e2ee_pub', pubBase64);
        localStorage.setItem('securechat_e2ee_priv', privJson);

        // Derive safety fingerprint (SHA-256 digest)
        const hash = await window.crypto.subtle.digest('SHA-256', exportedPub);
        const hex = Array.from(new Uint8Array(hash))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase()
          .match(/.{1,4}/g)
          .join(' ');

        setKeyPair({ publicKey: pair.publicKey, privateKey: pair.privateKey });
        setFingerprint(hex);

        // Upload public key to server
        await chatService.updatePublicKey({ publicKey: pubBase64, keyFingerprint: hex }).catch(() => {});
      } else {
        const privJwk = JSON.parse(storedPriv);
        const pubBuf = b642buf(storedPub);

        const publicKey = await window.crypto.subtle.importKey(
          'raw',
          pubBuf,
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          []
        );

        const privateKey = await window.crypto.subtle.importKey(
          'jwk',
          privJwk,
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          ['deriveKey', 'deriveBits']
        );

        const hash = await window.crypto.subtle.digest('SHA-256', pubBuf);
        const hex = Array.from(new Uint8Array(hash))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase()
          .match(/.{1,4}/g)
          .join(' ');

        setKeyPair({ publicKey, privateKey });
        setFingerprint(hex);
      }
    };

    if (currentUser) {
      initKeys();
    }
  }, [currentUser?._id]);

  // Encrypt plaintext with recipient public key
  const encryptMessage = useCallback(
    async (plaintext, recipientPubBase64) => {
      if (!keyPair || !recipientPubBase64) return { encrypted: false, content: plaintext };

      try {
        const recipientKeyBuf = b642buf(recipientPubBase64);
        const recipientPubKey = await window.crypto.subtle.importKey(
          'raw',
          recipientKeyBuf,
          { name: 'ECDH', namedCurve: 'P-256' },
          false,
          []
        );

        // Derive shared AES-GCM 256 key
        const sharedKey = await window.crypto.subtle.deriveKey(
          { name: 'ECDH', public: recipientPubKey },
          keyPair.privateKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );

        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(plaintext);

        const ciphertext = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          sharedKey,
          encoded
        );

        return {
          isEncrypted: true,
          encryptedPayload: buf2b64(ciphertext),
          nonce: buf2b64(iv),
          content: '🔒 [End-to-End Encrypted Message]',
        };
      } catch (e) {
        console.warn('[E2EE Encryption Error]', e);
        return { isEncrypted: false, content: plaintext };
      }
    },
    [keyPair]
  );

  // Decrypt ciphertext with sender public key
  const decryptMessage = useCallback(
    async (encryptedPayload, nonceBase64, senderPubBase64) => {
      if (!keyPair || !encryptedPayload || !nonceBase64 || !senderPubBase64) {
        return null;
      }

      try {
        const senderKeyBuf = b642buf(senderPubBase64);
        const senderPubKey = await window.crypto.subtle.importKey(
          'raw',
          senderKeyBuf,
          { name: 'ECDH', namedCurve: 'P-256' },
          false,
          []
        );

        const sharedKey = await window.crypto.subtle.deriveKey(
          { name: 'ECDH', public: senderPubKey },
          keyPair.privateKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );

        const ciphertext = b642buf(encryptedPayload);
        const iv = b642buf(nonceBase64);

        const decrypted = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          sharedKey,
          ciphertext
        );

        return new TextDecoder().decode(decrypted);
      } catch (e) {
        console.warn('[E2EE Decryption Failed]', e);
        return '[Unable to decrypt with current device key]';
      }
    },
    [keyPair]
  );

  return { keyPair, fingerprint, encryptMessage, decryptMessage };
};
