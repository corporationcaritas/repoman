const { ml_dsa65 } = require('@noble/post-quantum/ml-dsa.js');
const fs = require('fs');

const keys = ml_dsa65.keygen();

const privHex = Buffer.from(keys.secretKey).toString('hex');
const pubHex = Buffer.from(keys.publicKey).toString('hex');

fs.writeFileSync('caritas_pqc_private.hex', privHex, 'utf8');
fs.writeFileSync('caritas_pqc_public.hex', pubHex, 'utf8');

console.log(`[+] Keys Written to Disk:`);
console.log(`    - Private Key: ${keys.secretKey.length} bytes (${privHex.length} hex chars)`);
console.log(`    - Public Key : ${keys.publicKey.length} bytes (${pubHex.length} hex chars)`);
