const { ml_dsa65 } = require('@noble/post-quantum/ml-dsa.js');
const crypto = require('crypto');
const fs = require('fs');

const payloadPath = process.argv[2] || 'credential_data.json';

if (!fs.existsSync(payloadPath)) {
    console.error(`[!] Error: Payload file '${payloadPath}' not found. Run create-credential.js first.`);
    process.exit(1);
}

const rawData = fs.readFileSync(payloadPath, 'utf8');
const candidateData = JSON.parse(rawData);

// Canonicalize JSON payload deterministically
const canonicalJson = JSON.stringify(candidateData, Object.keys(candidateData).sort());
const dataHash = crypto.createHash('sha3-512').update(canonicalJson).digest('hex');
const messageBytes = new TextEncoder().encode(canonicalJson);

// Load existing keys or generate a new ML-DSA-65 keypair
let keys;
if (fs.existsSync('caritas_pqc_private.hex') && fs.existsSync('caritas_pqc_public.hex')) {
    const privHex = fs.readFileSync('caritas_pqc_private.hex', 'utf8').trim();
    const pubHex = fs.readFileSync('caritas_pqc_public.hex', 'utf8').trim();
    keys = {
        secretKey: new Uint8Array(Buffer.from(privHex, 'hex')),
        publicKey: new Uint8Array(Buffer.from(pubHex, 'hex'))
    };
} else {
    keys = ml_dsa65.keygen();
    fs.writeFileSync('caritas_pqc_private.hex', Buffer.from(keys.secretKey).toString('hex'), 'utf8');
    fs.writeFileSync('caritas_pqc_public.hex', Buffer.from(keys.publicKey).toString('hex'), 'utf8');
    console.log('[+] Generated new ML-DSA-65 Keypair (4032-byte secret / 1952-byte public).');
}

// Sign payload safely with parameter ordering fallback
let signatureBytes;
try {
    signatureBytes = ml_dsa65.sign(keys.secretKey, messageBytes);
} catch (e) {
    signatureBytes = ml_dsa65.sign(messageBytes, keys.secretKey);
}

const pqcSignatureHex = Buffer.from(signatureBytes).toString('hex');
const publicKeyHex = Buffer.from(keys.publicKey).toString('hex');

const recipientName = candidateData.credentialSubject?.name || 'Sovereign Recipient';
const programName = candidateData.name || 'Credential Program';
const issueDate = candidateData.dateCreated || new Date().toISOString().split('T')[0];
const credId = candidateData.id || 'CRT-LOCAL';

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Post-Quantum Verified Credential</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Montserrat:wght@400;600;700&family=Fira+Code:wght@400;600&display=swap');
        .font-serif-title { font-family: 'Cinzel', serif; }
        .font-sans-body { font-family: 'Montserrat', sans-serif; }
        .font-mono-code { font-family: 'Fira Code', monospace; }
    </style>
    
    <script type="application/ld+json" id="credential-payload">
    ${canonicalJson}
    </script>
</head>
<body class="bg-slate-950 text-slate-100 font-sans-body min-h-screen py-10 px-4 flex flex-col items-center">

    <div class="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl relative overflow-hidden">
        
        <div class="flex flex-wrap justify-between items-center bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-lg mb-8">
            <div class="flex items-center gap-3">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div>
                    <h3 class="text-sm font-bold text-emerald-400 uppercase tracking-wider">Post-Quantum Cryptographic Proof Attached</h3>
                    <p class="text-xs text-slate-400 font-mono-code">NIST FIPS 204 ML-DSA-65 | Governed by The People</p>
                </div>
            </div>
            <span class="bg-emerald-500/10 text-emerald-300 text-xs font-mono-code px-3 py-1 rounded border border-emerald-500/30">TAMPER-PROOF</span>
        </div>

        <div class="border-2 border-amber-500/50 p-8 rounded-lg bg-slate-900/90 text-center relative">
            <p class="font-serif-title text-amber-500 tracking-[0.25em] text-xs font-bold uppercase">Caritas Corporation</p>
            <p class="text-[10px] text-slate-400 tracking-wider uppercase mb-2">Controlled by and for The People</p>
            
            <h1 class="font-serif-title text-3xl sm:text-4xl font-extrabold text-white mt-2">CERTIFICATE OF COMPLETION</h1>
            
            <p class="text-xs text-slate-400 uppercase tracking-widest mt-6">This Verified Credential Is Awarded To</p>
            <h2 class="text-4xl font-extrabold text-amber-400 my-2 border-b border-slate-700 inline-block px-8 pb-1">${recipientName}</h2>
            
            <p class="max-w-xl mx-auto text-sm text-slate-300 mt-4 leading-relaxed">
                For successful completion of <strong class="text-white">${programName}</strong>.
            </p>

            <div class="mt-8 pt-6 border-t border-slate-800 flex justify-between text-left text-xs text-slate-400 font-mono-code">
                <div>Issue Date: <span class="text-white">${issueDate}</span></div>
                <div>ID: <span class="text-white">${credId}</span></div>
            </div>
        </div>

        <div class="mt-6 bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono-code text-[11px] space-y-3">
            <div class="text-amber-400 font-bold border-b border-slate-800 pb-1 flex justify-between">
                <span>ON-CHAIN / DECENTRALIZED PQC PROOF PAYLOAD</span>
                <span class="text-slate-500">SHA3-512</span>
            </div>
            
            <div>
                <span class="text-slate-500 block">Canonical Payload Hash:</span>
                <span class="text-emerald-400 break-all">${dataHash}</span>
            </div>

            <div>
                <span class="text-slate-500 block">ML-DSA-65 Signature:</span>
                <div id="pqc-signature" class="text-slate-300 break-all bg-slate-900 p-2 rounded max-h-20 overflow-y-auto border border-slate-800 text-[10px] my-1">
                    ${pqcSignatureHex}
                </div>
            </div>

            <div>
                <span class="text-slate-500 block">Issuer Public Key (Hex):</span>
                <div id="pqc-publickey" class="text-slate-400 break-all bg-slate-900 p-2 rounded border border-slate-800 text-[10px]">
                    ${publicKeyHex}
                </div>
            </div>
        </div>

    </div>

</body>
</html>`;

fs.writeFileSync('signed_certificate.html', htmlContent, 'utf8');
console.log(`[SUCCESS] Generated PQC-signed certificate for '${recipientName}' -> signed_certificate.html`);
