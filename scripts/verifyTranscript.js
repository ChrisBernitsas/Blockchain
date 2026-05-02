const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

const DEFAULT_FILE = "./sample-data/transcript-cmu-2026-0001.json";

function resolveTranscriptPath(filePath) {
  const finalPath = filePath || process.env.TRANSCRIPT_FILE || DEFAULT_FILE;
  return path.isAbsolute(finalPath)
    ? finalPath
    : path.resolve(process.cwd(), finalPath);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  // Prefer env vars with optional positional fallback.
  let contractAddress =
    process.env.TRANSCRIPT_CONTRACT || process.env.CONTRACT_ADDRESS;
  let credentialId = process.env.CREDENTIAL_ID;
  let transcriptFile = process.env.TRANSCRIPT_FILE || DEFAULT_FILE;

  if (args.length === 3) {
    [contractAddress, credentialId, transcriptFile] = args;
  } else if (args.length === 2) {
    if (ethers.isAddress(args[0])) {
      contractAddress = args[0];
      credentialId = args[1];
    } else {
      credentialId = args[0];
      transcriptFile = args[1];
    }
  } else if (args.length === 1) {
    if (ethers.isAddress(args[0]) && !contractAddress) {
      contractAddress = args[0];
    } else {
      credentialId = args[0];
    }
  }

  if (!contractAddress || !ethers.isAddress(contractAddress) || !credentialId) {
    throw new Error(
      "Set TRANSCRIPT_CONTRACT (or CONTRACT_ADDRESS) and CREDENTIAL_ID. Optional: TRANSCRIPT_FILE."
    );
  }

  return { contractAddress, credentialId, transcriptFile };
}

async function main() {
  const { contractAddress, credentialId, transcriptFile } = parseArgs(
    process.argv
  );
  const transcriptPath = resolveTranscriptPath(transcriptFile);
  const fileBytes = fs.readFileSync(transcriptPath);
  const submittedHash = ethers.keccak256(fileBytes);

  const contract = await ethers.getContractAt(
    "TranscriptVerification",
    contractAddress
  );
  const record = await contract.getTranscript(credentialId);
  const isAuthentic = await contract.verifyTranscript(credentialId, submittedHash);

  console.log("Contract address:", contractAddress);
  console.log("Credential ID:", credentialId);
  console.log("Transcript file:", transcriptPath);
  console.log("Submitted hash:", submittedHash);
  console.log("Record exists:", record[5]);
  console.log("Record is valid:", record[4]);
  console.log("Recorded hash:", record[0]);
  console.log("Issuer:", record[1]);
  console.log("Issue date (unix):", record[2].toString());
  console.log("Revoke date (unix):", record[3].toString());
  console.log("Verification result:", isAuthentic);
}

main();
