const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TranscriptVerification", function () {
  async function deployFixture() {
    const [admin, registrar, outsider] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("TranscriptVerification");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    return { contract, admin, registrar, outsider };
  }

  it("sets deployer as university admin and authorized issuer", async function () {
    const { contract, admin } = await deployFixture();
    expect(await contract.universityAdmin()).to.equal(admin.address);
    expect(await contract.authorizedIssuers(admin.address)).to.equal(true);
  });

  it("allows admin to authorize a registrar address", async function () {
    const { contract, registrar } = await deployFixture();
    await contract.setIssuerAuthorization(registrar.address, true);
    expect(await contract.authorizedIssuers(registrar.address)).to.equal(true);
  });

  it("blocks non-admin from authorizing issuers", async function () {
    const { contract, registrar, outsider } = await deployFixture();
    await expect(
      contract.connect(outsider).setIssuerAuthorization(registrar.address, true)
    ).to.be.revertedWithCustomError(contract, "NotAuthorizedIssuer");
  });

  it("blocks unauthorized issue attempts", async function () {
    const { contract, outsider } = await deployFixture();
    const hash = ethers.keccak256(ethers.toUtf8Bytes("transcript-v1"));

    await expect(
      contract.connect(outsider).issueTranscript("CMU-2026-1001", hash)
    ).to.be.revertedWithCustomError(contract, "NotAuthorizedIssuer");
  });

  it("issues transcript and verifies matching hash", async function () {
    const { contract } = await deployFixture();
    const credentialId = "CMU-2026-1002";
    const hash = ethers.keccak256(ethers.toUtf8Bytes("transcript-v2"));

    await contract.issueTranscript(credentialId, hash);
    expect(await contract.verifyTranscript(credentialId, hash)).to.equal(true);
  });

  it("fails verification for wrong hash", async function () {
    const { contract } = await deployFixture();
    const credentialId = "CMU-2026-1003";
    const correctHash = ethers.keccak256(ethers.toUtf8Bytes("transcript-v3"));
    const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("tampered-data"));

    await contract.issueTranscript(credentialId, correctHash);
    expect(await contract.verifyTranscript(credentialId, wrongHash)).to.equal(
      false
    );
  });

  it("rejects duplicate credential IDs", async function () {
    const { contract } = await deployFixture();
    const credentialId = "CMU-2026-1004";
    const hash = ethers.keccak256(ethers.toUtf8Bytes("transcript-v4"));

    await contract.issueTranscript(credentialId, hash);

    await expect(contract.issueTranscript(credentialId, hash)).to.be.revertedWithCustomError(
      contract,
      "CredentialAlreadyExists"
    );
  });

  it("rejects empty credential IDs", async function () {
    const { contract } = await deployFixture();
    const hash = ethers.keccak256(ethers.toUtf8Bytes("transcript-v6"));

    await expect(
      contract.issueTranscript("", hash)
    ).to.be.revertedWithCustomError(contract, "EmptyCredentialId");
  });

  it("rejects zero transcript hash", async function () {
    const { contract } = await deployFixture();
    const credentialId = "CMU-2026-1006";

    await expect(
      contract.issueTranscript(credentialId, ethers.ZeroHash)
    ).to.be.revertedWithCustomError(contract, "ZeroHashNotAllowed");
  });

  it("rejects revocation of missing credential", async function () {
    const { contract } = await deployFixture();
    const credentialId = "CMU-2026-1007";

    await expect(
      contract.revokeTranscript(credentialId, "Not found")
    ).to.be.revertedWithCustomError(contract, "CredentialNotFound").withArgs(
      credentialId
    );
  });

  it("revokes transcript while keeping record on-chain", async function () {
    const { contract } = await deployFixture();
    const credentialId = "CMU-2026-1005";
    const hash = ethers.keccak256(ethers.toUtf8Bytes("transcript-v5"));

    await contract.issueTranscript(credentialId, hash);
    await contract.revokeTranscript(credentialId, "Administrative correction");

    const record = await contract.getTranscript(credentialId);
    expect(record[5]).to.equal(true);
    expect(record[4]).to.equal(false);
    expect(await contract.verifyTranscript(credentialId, hash)).to.equal(false);
  });

  it("rejects revocation of already revoked credential", async function () {
    const { contract } = await deployFixture();
    const credentialId = "CMU-2026-1008";
    const hash = ethers.keccak256(ethers.toUtf8Bytes("transcript-v8"));

    await contract.issueTranscript(credentialId, hash);
    await contract.revokeTranscript(credentialId, "Administrative correction");

    await expect(
      contract.revokeTranscript(credentialId, "Second revocation attempt")
    ).to.be.revertedWithCustomError(
      contract,
      "CredentialAlreadyRevoked"
    ).withArgs(credentialId);
  });
});
