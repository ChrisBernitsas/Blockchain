const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

function readTranscriptAndHash(filePath) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const fileBytes = fs.readFileSync(absolutePath);
  const hash = ethers.keccak256(fileBytes);
  return { absolutePath, hash };
}

async function main() {
  const [admin, registrar, verifier] = await ethers.getSigners();
  const TranscriptVerification = await ethers.getContractFactory(
    "TranscriptVerification"
  );
  const contract = await TranscriptVerification.deploy();
  await contract.waitForDeployment();

  const credentialId = "CMU-2026-0001";
  const transcriptFile = "./sample-data/transcript-cmu-2026-0001.json";
  const { absolutePath, hash: transcriptHash } = readTranscriptAndHash(
    transcriptFile
  );

  console.log("Transcript file:", absolutePath);
  console.log("Transcript hash:", transcriptHash);
  console.log("Contract address:", await contract.getAddress());
  console.log("Admin address:", admin.address);
  console.log("Registrar address:", registrar.address);
  console.log("Verifier address:", verifier.address);

  let tx = await contract
    .connect(admin)
    .setIssuerAuthorization(registrar.address, true);
  await tx.wait();
  console.log("Registrar authorized.");

  tx = await contract
    .connect(registrar)
    .issueTranscript(credentialId, transcriptHash);
  await tx.wait();
  console.log("Issued credential:", credentialId);

  const issuedRecord = await contract.getTranscript(credentialId);
  console.log("On-chain record exists:", issuedRecord[5]);
  console.log("On-chain record valid:", issuedRecord[4]);

  const verifiedGood = await contract
    .connect(verifier)
    .verifyTranscript(credentialId, transcriptHash);
  console.log("Verification with matching hash:", verifiedGood);

  const tamperedHash = ethers.keccak256(
    ethers.toUtf8Bytes("tampered-file-content")
  );
  const verifiedTampered = await contract
    .connect(verifier)
    .verifyTranscript(credentialId, tamperedHash);
  console.log("Verification with mismatched hash:", verifiedTampered);

  tx = await contract
    .connect(registrar)
    .revokeTranscript(credentialId, "Issued with incorrect course list");
  await tx.wait();
  console.log("Credential revoked.");

  const verifiedAfterRevoke = await contract
    .connect(verifier)
    .verifyTranscript(credentialId, transcriptHash);
  console.log("Verification after revocation:", verifiedAfterRevoke);

  const revokedRecord = await contract.getTranscript(credentialId);
  console.log("Final isValid status:", revokedRecord[4]);
}

main();
