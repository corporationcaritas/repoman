const { ml_dsa65 } = require('@noble/post-quantum/ml-dsa.js');
const fs = require('fs');

const htmlFile = process.argv[2] || 'signed_certificate.html';
const trustedPublicKeyPath = process.argv[3] || 'caritas_pqc_public.hex';

if (!fs.existsSync(htmlFile)) {
    console.error(`[!] Error: Certificate file '${htmlFile}' not found.`);
    process.exit(1);
}

if (!fs.existsSync(trustedPublicKeyPath)) {
    console.error(`[!] Error: Trusted public key '${trustedPublicKeyPath}' not found!`);
    process.exit(1);
}

const HTML = fs.readFileSync(htmlFile, 'utf8');

const jsonMatch = HTML.match(/<script type="application\/ld\+json" id="credential-payload">([\s\S]*?)<\/script>/);
const sigMatch = HTML.match(/<div id="pqc-signature"[^>]*>\s*([\s\S]*?)\s*<\/div>/);

if (!jsonMatch || !sigMatch) {
    console.error('[!] Verification failed: Missing JSON-LD payload or PQC signature in HTML.');
    process.exit(1);
}

const rawJson = jsonMatch[1].trim();
const signatureHex = sigMatch[1].trim();
const trustedPubKeyHex = fs.readFileSync(trustedPublicKeyPath, 'utf8').trim();

const parsedData = JSON.parse(rawJson);
const canonicalJson = JSON.stringify(parsedData, Object.keys(parsedData).sort());
const messageBytes = new TextEncoder().encode(canonicalJson);

const signature = new Uint8Array(Buffer.from(signatureHex, 'hex'));
const publicKey = new Uint8Array(Buffer.from(trustedPubKeyHex, 'hex'));

let isValid = false;
try {
    isValid = ml_dsa65.verify(signature, messageBytes, publicKey);
} catch (e) {
    try {
        isValid = ml_dsa65.verify(publicKey, messageBytes, signature);
    } catch (e2) {
        isValid = ml_dsa65.verify(signature, publicKey, messageBytes);
    }
}

// Robust fallback extraction for Governance
const recipient = parsedData.credentialSubject?.name || 'Sovereign Recipient';
const issuer = parsedData.issuer?.name || 'Caritas Corporation';
const governance = parsedData.issuer?.parentOrganization?.name || 'The People (Decentralized Network Authority)';

console.log('\n======================================================');
console.log(` POST-QUANTUM VERIFICATION RESULT: ${isValid ? 'VALID (AUTHENTIC)' : 'INVALID / FORGED!'}`);
console.log('======================================================');
console.log(`Recipient  : ${recipient}`);
console.log(`Issuer     : ${issuer}`);
console.log(`Governance : ${governance}`);
console.log(`Trust Key  : ${trustedPublicKeyPath}`);
console.log(`Status     : ${isValid ? 'Authentic document verified against root key' : 'REJECTED! Signature mismatch.'}\n`);
