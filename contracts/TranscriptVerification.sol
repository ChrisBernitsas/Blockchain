// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TranscriptVerification {
    error NotAuthorizedIssuer();
    error CredentialAlreadyExists(string credentialId);
    error CredentialNotFound(string credentialId);
    error CredentialAlreadyRevoked(string credentialId);
    error EmptyCredentialId();
    error ZeroHashNotAllowed();

    struct TranscriptRecord {
        bytes32 transcriptHash;
        address issuer;
        uint64 issueDate;
        uint64 revokeDate;
        bool isValid;
        bool exists;
    }

    address public immutable universityAdmin;
    mapping(address => bool) public authorizedIssuers;
    mapping(string => TranscriptRecord) private transcripts;

    event IssuerAuthorizationUpdated(address indexed issuer, bool isAuthorized);
    event TranscriptIssued(
        string indexed credentialId,
        bytes32 transcriptHash,
        address indexed issuer,
        uint64 issueDate
    );
    event TranscriptRevoked(
        string indexed credentialId,
        address indexed revokedBy,
        uint64 revokeDate,
        string reason
    );

    modifier onlyIssuer() {
        if (!authorizedIssuers[msg.sender]) {
            revert NotAuthorizedIssuer();
        }
        _;
    }

    constructor() {
        universityAdmin = msg.sender;
        authorizedIssuers[msg.sender] = true;
        emit IssuerAuthorizationUpdated(msg.sender, true);
    }

    function setIssuerAuthorization(address issuer, bool isAuthorized) external {
        if (msg.sender != universityAdmin) {
            revert NotAuthorizedIssuer();
        }
        authorizedIssuers[issuer] = isAuthorized;
        emit IssuerAuthorizationUpdated(issuer, isAuthorized);
    }

    function issueTranscript(
        string calldata credentialId,
        bytes32 transcriptHash
    ) external onlyIssuer {
        if (bytes(credentialId).length == 0) {
            revert EmptyCredentialId();
        }
        if (transcriptHash == bytes32(0)) {
            revert ZeroHashNotAllowed();
        }
        if (transcripts[credentialId].exists) {
            revert CredentialAlreadyExists(credentialId);
        }

        transcripts[credentialId] = TranscriptRecord({
            transcriptHash: transcriptHash,
            issuer: msg.sender,
            issueDate: uint64(block.timestamp),
            revokeDate: 0,
            isValid: true,
            exists: true
        });

        emit TranscriptIssued(
            credentialId,
            transcriptHash,
            msg.sender,
            uint64(block.timestamp)
        );
    }

    function revokeTranscript(
        string calldata credentialId,
        string calldata reason
    ) external onlyIssuer {
        TranscriptRecord storage record = transcripts[credentialId];
        if (!record.exists) {
            revert CredentialNotFound(credentialId);
        }
        if (!record.isValid) {
            revert CredentialAlreadyRevoked(credentialId);
        }

        record.isValid = false;
        record.revokeDate = uint64(block.timestamp);

        emit TranscriptRevoked(
            credentialId,
            msg.sender,
            uint64(block.timestamp),
            reason
        );
    }

    function getTranscript(
        string calldata credentialId
    )
        external
        view
        returns (
            bytes32 transcriptHash,
            address issuer,
            uint64 issueDate,
            uint64 revokeDate,
            bool isValid,
            bool exists
        )
    {
        TranscriptRecord memory record = transcripts[credentialId];
        return (
            record.transcriptHash,
            record.issuer,
            record.issueDate,
            record.revokeDate,
            record.isValid,
            record.exists
        );
    }

    function verifyTranscript(
        string calldata credentialId,
        bytes32 submittedHash
    ) external view returns (bool) {
        TranscriptRecord memory record = transcripts[credentialId];
        if (!record.exists || !record.isValid) {
            return false;
        }
        return record.transcriptHash == submittedHash;
    }
}
