# Transcript Verification for Blockchain Final Code

This project implements the code companion for the whitepaper proposal:

- Store only a cryptographic transcript proof (hash) on-chain.
- Keep the full transcript off-chain in university systems.
- Allow only university-authorized issuers to issue/revoke records.
- Let any verifier confirm authenticity by comparing hashes.

I referenced Lab 1 and 2 while making this.

## Project Structure

- `contracts/TranscriptVerification.sol`
- `scripts/hashTranscript.js`
- `scripts/demoTranscriptFlow.js`
- `sample-data/transcript-cmu-2026-0001.json`
- `test/TranscriptVerification.test.js`

## Setup

From this directory:

```bash
npm install
```

## Compile

```bash
npx hardhat compile
```

## Run Tests

```bash
npx hardhat test
```

The tests cover:

- authorized issuer control
- issue transcript proof
- verify transcript with matching hash
- mismatch failure
- revoke/correction flow
- on-chain audit trail retained after revocation

## Deploy Contract

```bash
npx hardhat run scripts/deploy.js
```

## Hash an Off-Chain Transcript File

```bash
npx hardhat run scripts/hashTranscript.js
```

This prints the `keccak256` hash you would store on-chain.

To hash a different file:

```bash
TRANSCRIPT_FILE=./path/to/your/transcript.pdf npx hardhat run scripts/hashTranscript.js
```

## Demo Flow (Outputs shown in our Demo Video)

```bash
npx hardhat run scripts/demoTranscriptFlow.js
```

Demo script sequence:

1. Deploy contract.
2. Authorize registrar address.
3. Hash off-chain transcript file.
4. Issue transcript proof on-chain.
5. Verify with matching hash (`true`).
6. Verify with mismatched hash (`false`).
7. Revoke credential.
8. Verify again after revocation (`false`).

## Optional Local Node

Terminal 1:

```bash
npx hardhat node
```

Terminal 2:

```bash
npx hardhat run scripts/demoTranscriptFlow.js --network localhost
```

## Whitepaper Info

- **Smart Contract Data Model:** `credentialId` key, `transcriptHash`, `issuer`, `issueDate`, `isValid`, `exists`, `revokeDate`.
- **Core Functions:** `issueTranscript`, `revokeTranscript`, `getTranscript`, `verifyTranscript`, `setIssuerAuthorization`.
- **Governance/Control:** `authorizedIssuers` and admin-controlled authorization updates.
- **Privacy:** full transcript never stored on-chain. only hash and minimal metadata are on-chain.
