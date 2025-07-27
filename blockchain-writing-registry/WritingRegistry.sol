// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract WritingRegistry {
    struct Proof {
        string title;
        string license;
        string twitterHandle;
        uint256 timestamp;
        address creator;
    }

    // Mapping from content hash to Proof struct
    mapping(string => Proof) private _proofs;
    // Set to track registered hashes for O(1) lookups
    mapping(string => bool) private _registeredHashes;
    // Mapping from creator address to array of content hashes
    mapping(address => string[]) private _creatorContent;
    // Mapping to track if a hash is already in a creator's array (to avoid duplicates)
    mapping(address => mapping(string => bool)) private _creatorHashExists;

    event ProofRegistered(
        string indexed hash,
        string title,
        string license,
        string twitterHandle,
        uint256 timestamp,
        address indexed creator
    );

    /**
     * @dev Register a new content proof on the blockchain
     * @param hash The SHA-256 hash of the content
     * @param title The title of the content
     * @param license The license type of the content
     * @param twitterHandle Optional Twitter handle for attribution
     */
    function registerProof(
        string calldata hash,
        string calldata title,
        string calldata license,
        string calldata twitterHandle
    ) external {
        require(!_registeredHashes[hash], "WritingRegistry: Hash already registered");
        require(bytes(hash).length == 66, "WritingRegistry: Invalid hash length"); // SHA-256 hash should be 66 characters (0x + 64 hex)

        _registeredHashes[hash] = true;
        _proofs[hash] = Proof({
            title: title,
            license: license,
            twitterHandle: twitterHandle,
            timestamp: block.timestamp,
            creator: msg.sender
        });

        // Add hash to creator's content array if not already present
        if (!_creatorHashExists[msg.sender][hash]) {
            _creatorContent[msg.sender].push(hash);
            _creatorHashExists[msg.sender][hash] = true;
        }

        emit ProofRegistered(hash, title, license, twitterHandle, block.timestamp, msg.sender);
    }

    /**
     * @dev Retrieve a content proof by its hash
     * @param hash The SHA-256 hash of the content to retrieve
     * @return The Proof struct containing the content metadata
     */
    function getProof(string calldata hash) external view returns (Proof memory) {
        require(_registeredHashes[hash], "WritingRegistry: Hash not registered");
        return _proofs[hash];
    }

    /**
     * @dev Check if a hash is already registered
     * @param hash The SHA-256 hash to check
     * @return Boolean indicating whether the hash is registered
     */
    function isHashRegistered(string calldata hash) external view returns (bool) {
        return _registeredHashes[hash];
    }

    /**
     * @dev Get all content hashes registered by a specific creator
     * @param creator The address of the creator
     * @return Array of content hashes registered by the creator
     */
    function getContentByCreator(address creator) external view returns (string[] memory) {
        return _creatorContent[creator];
    }

    /**
     * @dev Get the count of content hashes registered by a specific creator
     * @param creator The address of the creator
     * @return Number of content hashes registered by the creator
     */
    function getCreatorContentCount(address creator) external view returns (uint256) {
        return _creatorContent[creator].length;
    }
}
