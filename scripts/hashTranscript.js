const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

function resolveInputPath(argPath) {
  const defaultPath = "./sample-data/transcript-cmu-2026-0001.json";
  const finalPath = argPath || process.env.TRANSCRIPT_FILE || defaultPath;

  return path.isAbsolute(finalPath)
    ? finalPath
    : path.resolve(process.cwd(), finalPath);
}

async function main() {
  const fileArg = process.argv[2];
  const inputPath = resolveInputPath(fileArg);
  const fileBytes = fs.readFileSync(inputPath);
  const transcriptHash = ethers.keccak256(fileBytes);

  console.log("Transcript file:", inputPath);
  console.log("Transcript hash:", transcriptHash);
}

main();
