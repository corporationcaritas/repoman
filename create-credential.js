const fs = require('fs');

function createCredential(recipientName, programTitle, credentialId, statutoryAuth) {
    const domain = "https://caritascorporation.org";

    const payload = {
        "@context": [
            "https://www.w3.org/ns/credentials/v2",
            "https://schema.org"
        ],
        "type": ["VerifiableCredential", "EducationalOccupationalCredential"],
        "id": `urn:uuid:${credentialId}`,
        "name": programTitle,
        "credentialCategory": "State Recognized Certificate of Completion",
        "dateCreated": new Date().toISOString().split('T')[0],
        
        // Live Domain Policy & Governance Anchors
        "governancePolicy": {
            "@type": "CreativeWork",
            "name": "Certification Practice Statement (CPS)",
            "url": `${domain}/legal/cps-v1.pdf`,
            "version": "1.0.0",
            "complianceStandard": "NIST FIPS 204 (ML-DSA-65) Post-Quantum Cryptography",
            "statutoryAuthority": statutoryAuth || "State Reentry Rehabilitation Act § 402 / 28 CFR Part 545",
            "publicKeyDiscovery": `${domain}/.well-known/pqc-key.hex`
        },

        "issuer": {
            "@type": "Organization",
            "name": "Caritas Corporation",
            "description": "An operational stewardship entity controlled by and acting for The People.",
            "parentOrganization": {
                "@type": "Organization",
                "name": "The People (Decentralized Network Authority)",
                "description": "Sovereign collective governance body holding root trust anchor."
            },
            "url": domain
        },

        "credentialSubject": {
            "@type": "Person",
            "name": recipientName,
            "description": "Sovereign Individual Credential Holder",
            "hasCredential": {
                "@type": "EducationalOccupationalCredential",
                "credentialCategory": "Reentry Workforce Credential",
                "recognizedBy": {
                    "@type": "GovernmentOrganization",
                    "name": "Department of Corrections / State Licensing Board"
                }
            }
        }
    };

    fs.writeFileSync('credential_data.json', JSON.stringify(payload, null, 2), 'utf8');
    console.log(`[+] Created production payload anchored to ${domain} -> credential_data.json`);
}

const name = process.argv[2] || "Participant Name";
const program = process.argv[3] || "Electrical Apprenticeship";
const id = process.argv[4] || "CRT-2026-00101";
const statutoryAuth = process.argv[5] || "State Reentry Rehabilitation Act § 402";

createCredential(name, program, id, statutoryAuth);
