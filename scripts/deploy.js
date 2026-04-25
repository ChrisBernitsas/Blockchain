const { ethers } = require("hardhat");

async function main() {
  const TranscriptVerification = await ethers.getContractFactory(
    "TranscriptVerification"
  );
  const contract = await TranscriptVerification.deploy();
  await contract.waitForDeployment();

  console.log("TranscriptVerification deployed to:", await contract.getAddress());
}

main();
