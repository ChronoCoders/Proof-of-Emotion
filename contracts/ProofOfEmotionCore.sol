// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./EmotionToken.sol";
import "./BiometricValidator.sol";

/**
 * @title ProofOfEmotionCore
 * @dev Core smart contract implementing Proof of Emotion consensus mechanism
 * @author EmotionalChain Technologies
 * @notice World's first AI-powered emotional blockchain consensus system
 */
contract ProofOfEmotionCore is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // ============ STRUCTURES ============

    struct EmotionalProof {
        address validator;
        uint256 timestamp;
        uint256 blockHeight;
        // Biometric data (scaled to uint256 for precision)
        uint256 heartRate;          // BPM * 100 for precision
        uint256 hrv;               // milliseconds * 100
        uint256 stressLevel;       // 0-10000 (0-100.00%)
        uint256 energyLevel;       // 0-10000 (0-100.00%)
        uint256 focusLevel;        // 0-10000 (0-100.00%)
        uint256 authenticityScore; // 0-10000 (0-100.00%)
        bytes32 biometricHash;     // Hash of raw biometric data
        bytes signature;           // Cryptographic signature
        bool mlProcessed;          // Whether AI models processed this proof
        string emotionCategory;    // AI-classified emotion (calm, focused, etc.)
        uint256 confidence;        // ML confidence score (0-10000)
    }

    struct ConsensusBlock {
        uint256 blockHeight;
        uint256 timestamp;
        uint256 networkStress;      // Weighted average stress (0-10000)
        uint256 networkEnergy;      // Weighted average energy (0-10000)
        uint256 networkFocus;       // Weighted average focus (0-10000)
        uint256 networkAuthenticity; // Weighted average authenticity (0-10000)
        uint256 agreementScore;     // Consensus agreement percentage (0-10000)
        uint256 participatingValidators;
        uint256 totalStake;
        bool consensusReached;
        bytes32 consensusHash;
    }

    struct Validator {
        address validatorAddress;
        uint256 stake;
        string biometricDevice;
        uint256 joinedAt;
        uint256 reputation;         // 0-10000 (0-100.00%)
        uint256 totalBlocks;
        uint256 missedBlocks;
        bool isActive;
        uint256 lastProofTimestamp;
    }

    // ============ STATE VARIABLES ============

    EmotionToken public emotionToken;
    BiometricValidator public biometricValidator;

    // Core consensus parameters
    uint256 public constant CONSENSUS_THRESHOLD = 6700;  // 67.00%
    uint256 public constant MIN_VALIDATORS = 3;
    uint256 public constant MAX_VALIDATORS = 21;
    uint256 public constant MIN_STAKE = 10000 * 10**18;  // 10,000 EMOTION tokens
    uint256 public constant VALIDATION_WINDOW = 300;     // 5 minutes
    uint256 public constant MIN_AUTHENTICITY = 8000;     // 80.00%

    // Network state
    uint256 public currentBlockHeight;
    uint256 public totalNetworkStake;
    uint256 public activeValidatorCount;

    // Storage mappings
    mapping(address => Validator) public validators;
    mapping(uint256 => EmotionalProof[]) public blockEmotionalProofs;
    mapping(uint256 => ConsensusBlock) public consensusBlocks;
    mapping(address => bool) public authorizedMLOracles;
    
    // Arrays for iteration
    address[] public validatorAddresses;
    uint256[] public recentBlocks;

    // ============ EVENTS ============

    event ValidatorRegistered(
        address indexed validator,
        uint256 stake,
        string biometricDevice
    );

    event EmotionalProofSubmitted(
        address indexed validator,
        uint256 indexed blockHeight,
        uint256 stressLevel,
        uint256 energyLevel,
        uint256 focusLevel,
        uint256 authenticityScore,
        bool mlProcessed,
        string emotionCategory
    );

    event ConsensusReached(
        uint256 indexed blockHeight,
        uint256 agreementScore,
        uint256 participatingValidators,
        uint256 networkStress,
        uint256 networkEnergy,
        uint256 networkFocus,
        uint256 networkAuthenticity
    );

    event ConsensusFailure(
        uint256 indexed blockHeight,
        uint256 agreementScore,
        uint256 participatingValidators,
        string reason
    );

    event ValidatorSlashed(
        address indexed validator,
        uint256 amount,
        string reason
    );

    event MLOracleUpdated(
        address indexed oracle,
        bool authorized
    );

    // ============ MODIFIERS ============

    modifier onlyActiveValidator() {
        require(validators[msg.sender].isActive, "Not an active validator");
        require(validators[msg.sender].stake >= MIN_STAKE, "Insufficient stake");
        _;
    }

    modifier onlyMLOracle() {
        require(authorizedMLOracles[msg.sender], "Not an authorized ML oracle");
        _;
    }

    modifier validBlockHeight(uint256 blockHeight) {
        require(blockHeight > currentBlockHeight, "Invalid block height");
        _;
    }

    // ============ CONSTRUCTOR ============

    constructor(
        address _emotionTokenAddress,
        address _biometricValidatorAddress
    ) {
        emotionToken = EmotionToken(_emotionTokenAddress);
        biometricValidator = BiometricValidator(_biometricValidatorAddress);
        currentBlockHeight = 0;
    }

    // ============ VALIDATOR MANAGEMENT ============

    /**
     * @dev Register as a validator by staking EMOTION tokens
     * @param stake Amount of EMOTION tokens to stake
     * @param biometricDevice Description of biometric device used
     */
    function registerValidator(
        uint256 stake,
        string memory biometricDevice
    ) external nonReentrant {
        require(stake >= MIN_STAKE, "Minimum stake not met");
        require(activeValidatorCount < MAX_VALIDATORS, "Max validators reached");
        require(!validators[msg.sender].isActive, "Already registered");
        require(bytes(biometricDevice).length > 0, "Biometric device required");

        // Transfer stake to contract
        require(
            emotionToken.transferFrom(msg.sender, address(this), stake),
            "Stake transfer failed"
        );

        // Register validator
        validators[msg.sender] = Validator({
            validatorAddress: msg.sender,
            stake: stake,
            biometricDevice: biometricDevice,
            joinedAt: block.timestamp,
            reputation: 10000, // Start with 100% reputation
            totalBlocks: 0,
            missedBlocks: 0,
            isActive: true,
            lastProofTimestamp: 0
        });

        validatorAddresses.push(msg.sender);
        totalNetworkStake = totalNetworkStake.add(stake);
        activeValidatorCount = activeValidatorCount.add(1);

        emit ValidatorRegistered(msg.sender, stake, biometricDevice);
    }

    /**
     * @dev Increase validator stake
     * @param additionalStake Additional EMOTION tokens to stake
     */
    function increaseStake(uint256 additionalStake) external onlyActiveValidator nonReentrant {
        require(additionalStake > 0, "Must stake positive amount");
        
        require(
            emotionToken.transferFrom(msg.sender, address(this), additionalStake),
            "Stake transfer failed"
        );

        validators[msg.sender].stake = validators[msg.sender].stake.add(additionalStake);
        totalNetworkStake = totalNetworkStake.add(additionalStake);
    }

    /**
     * @dev Withdraw validator stake and exit network
     */
    function withdrawStake() external onlyActiveValidator nonReentrant {
        Validator storage validator = validators[msg.sender];
        uint256 stakeAmount = validator.stake;

        // Deactivate validator
        validator.isActive = false;
        validator.stake = 0;
        totalNetworkStake = totalNetworkStake.sub(stakeAmount);
        activeValidatorCount = activeValidatorCount.sub(1);

        // Return stake
        require(emotionToken.transfer(msg.sender, stakeAmount), "Stake return failed");

        // Remove from active validators array
        _removeValidatorFromArray(msg.sender);
    }

    // ============ EMOTIONAL PROOF SUBMISSION ============

    /**
     * @dev Submit emotional proof for consensus participation
     * @param blockHeight Target block height for consensus
     * @param heartRate Heart rate in BPM * 100
     * @param hrv Heart rate variability in ms * 100
     * @param stressLevel Stress level (0-10000)
     * @param energyLevel Energy level (0-10000)
     * @param focusLevel Focus level (0-10000)
     * @param authenticityScore AI authenticity score (0-10000)
     * @param biometricHash Hash of raw biometric data
     * @param signature Cryptographic signature
     * @param mlProcessed Whether AI models processed this data
     * @param emotionCategory AI-classified emotion category
     * @param confidence ML confidence score (0-10000)
     */
    function submitEmotionalProof(
        uint256 blockHeight,
        uint256 heartRate,
        uint256 hrv,
        uint256 stressLevel,
        uint256 energyLevel,
        uint256 focusLevel,
        uint256 authenticityScore,
        bytes32 biometricHash,
        bytes memory signature,
        bool mlProcessed,
        string memory emotionCategory,
        uint256 confidence
    ) external onlyActiveValidator validBlockHeight(blockHeight) {
        require(authenticityScore >= MIN_AUTHENTICITY, "Insufficient authenticity");
        require(stressLevel <= 10000 && energyLevel <= 10000 && focusLevel <= 10000, "Invalid emotion levels");
        require(confidence <= 10000, "Invalid confidence score");
        
        // Verify biometric signature
        require(
            biometricValidator.verifyBiometricSignature(
                msg.sender,
                biometricHash,
                signature
            ),
            "Invalid biometric signature"
        );

        // Check for duplicate submissions
        EmotionalProof[] storage proofs = blockEmotionalProofs[blockHeight];
        for (uint i = 0; i < proofs.length; i++) {
            require(proofs[i].validator != msg.sender, "Proof already submitted");
        }

        // Create and store emotional proof
        EmotionalProof memory proof = EmotionalProof({
            validator: msg.sender,
            timestamp: block.timestamp,
            blockHeight: blockHeight,
            heartRate: heartRate,
            hrv: hrv,
            stressLevel: stressLevel,
            energyLevel: energyLevel,
            focusLevel: focusLevel,
            authenticityScore: authenticityScore,
            biometricHash: biometricHash,
            signature: signature,
            mlProcessed: mlProcessed,
            emotionCategory: emotionCategory,
            confidence: confidence
        });

        blockEmotionalProofs[blockHeight].push(proof);
        validators[msg.sender].lastProofTimestamp = block.timestamp;

        emit EmotionalProofSubmitted(
            msg.sender,
            blockHeight,
            stressLevel,
            energyLevel,
            focusLevel,
            authenticityScore,
            mlProcessed,
            emotionCategory
        );
    }

    // ============ CONSENSUS CALCULATION ============

    /**
     * @dev Calculate Proof of Emotion consensus for a block
     * @param blockHeight Block height to calculate consensus for
     */
    function calculateConsensus(uint256 blockHeight) 
        external 
        onlyMLOracle 
        returns (bool consensusReached) 
    {
        EmotionalProof[] storage proofs = blockEmotionalProofs[blockHeight];
        require(proofs.length >= MIN_VALIDATORS, "Insufficient validators");

        // Calculate stake-weighted emotional metrics
        (
            uint256 networkStress,
            uint256 networkEnergy,
            uint256 networkFocus,
            uint256 networkAuthenticity,
            uint256 totalStake
        ) = _calculateWeightedMetrics(proofs);

        // Calculate emotional agreement score
        uint256 agreementScore = _calculateEmotionalAgreement(proofs);

        // Determine consensus result
        consensusReached = agreementScore >= CONSENSUS_THRESHOLD;

        // Create consensus block
        ConsensusBlock memory consensusBlock = ConsensusBlock({
            blockHeight: blockHeight,
            timestamp: block.timestamp,
            networkStress: networkStress,
            networkEnergy: networkEnergy,
            networkFocus: networkFocus,
            networkAuthenticity: networkAuthenticity,
            agreementScore: agreementScore,
            participatingValidators: proofs.length,
            totalStake: totalStake,
            consensusReached: consensusReached,
            consensusHash: _calculateConsensusHash(blockHeight, agreementScore, totalStake)
        });

        consensusBlocks[blockHeight] = consensusBlock;
        recentBlocks.push(blockHeight);

        // Update current block height if consensus reached
        if (consensusReached) {
            currentBlockHeight = blockHeight;
            _updateValidatorReputations(proofs, true);
            
            emit ConsensusReached(
                blockHeight,
                agreementScore,
                proofs.length,
                networkStress,
                networkEnergy,
                networkFocus,
                networkAuthenticity
            );
        } else {
            _updateValidatorReputations(proofs, false);
            
            emit ConsensusFailure(
                blockHeight,
                agreementScore,
                proofs.length,
                "Agreement threshold not met"
            );
        }

        return consensusReached;
    }

    // ============ INTERNAL CONSENSUS FUNCTIONS ============

    /**
     * @dev Calculate stake-weighted emotional metrics
     */
    function _calculateWeightedMetrics(EmotionalProof[] storage proofs)
        internal
        view
        returns (
            uint256 networkStress,
            uint256 networkEnergy,
            uint256 networkFocus,
            uint256 networkAuthenticity,
            uint256 totalStake
        )
    {
        uint256 weightedStress = 0;
        uint256 weightedEnergy = 0;
        uint256 weightedFocus = 0;
        uint256 weightedAuthenticity = 0;
        totalStake = 0;

        for (uint i = 0; i < proofs.length; i++) {
            uint256 validatorStake = validators[proofs[i].validator].stake;
            
            weightedStress = weightedStress.add(proofs[i].stressLevel.mul(validatorStake));
            weightedEnergy = weightedEnergy.add(proofs[i].energyLevel.mul(validatorStake));
            weightedFocus = weightedFocus.add(proofs[i].focusLevel.mul(validatorStake));
            weightedAuthenticity = weightedAuthenticity.add(proofs[i].authenticityScore.mul(validatorStake));
            totalStake = totalStake.add(validatorStake);
        }

        networkStress = weightedStress.div(totalStake);
        networkEnergy = weightedEnergy.div(totalStake);
        networkFocus = weightedFocus.div(totalStake);
        networkAuthenticity = weightedAuthenticity.div(totalStake);
    }

    /**
     * @dev Calculate emotional agreement score between validators
     */
    function _calculateEmotionalAgreement(EmotionalProof[] storage proofs)
        internal
        view
        returns (uint256 agreementScore)
    {
        if (proofs.length < 2) return 10000; // 100% if only one validator

        uint256 totalAgreement = 0;
        uint256 totalComparisons = 0;

        for (uint i = 0; i < proofs.length; i++) {
            for (uint j = i + 1; j < proofs.length; j++) {
                uint256 stake1 = validators[proofs[i].validator].stake;
                uint256 stake2 = validators[proofs[j].validator].stake;
                
                // Calculate similarity between emotional states
                uint256 stressSim = _calculateSimilarity(proofs[i].stressLevel, proofs[j].stressLevel);
                uint256 energySim = _calculateSimilarity(proofs[i].energyLevel, proofs[j].energyLevel);
                uint256 focusSim = _calculateSimilarity(proofs[i].focusLevel, proofs[j].focusLevel);
                
                uint256 avgSimilarity = (stressSim.add(energySim).add(focusSim)).div(3);
                uint256 combinedStake = stake1.add(stake2);
                
                totalAgreement = totalAgreement.add(avgSimilarity.mul(combinedStake));
                totalComparisons = totalComparisons.add(combinedStake);
            }
        }

        agreementScore = totalComparisons > 0 ? totalAgreement.div(totalComparisons) : 0;
    }

    /**
     * @dev Calculate similarity between two values (0-10000 scale)
     */
    function _calculateSimilarity(uint256 value1, uint256 value2) 
        internal 
        pure 
        returns (uint256 similarity) 
    {
        uint256 difference = value1 > value2 ? value1.sub(value2) : value2.sub(value1);
        similarity = difference < 10000 ? uint256(10000).sub(difference) : 0;
    }

    /**
     * @dev Update validator reputations based on consensus participation
     */
    function _updateValidatorReputations(EmotionalProof[] storage proofs, bool consensusSuccess) internal {
        for (uint i = 0; i < proofs.length; i++) {
            address validatorAddr = proofs[i].validator;
            Validator storage validator = validators[validatorAddr];
            
            if (consensusSuccess) {
                validator.totalBlocks = validator.totalBlocks.add(1);
                // Increase reputation for successful consensus participation
                if (validator.reputation < 10000) {
                    validator.reputation = validator.reputation.add(10); // +0.1%
                    if (validator.reputation > 10000) validator.reputation = 10000;
                }
            } else {
                validator.missedBlocks = validator.missedBlocks.add(1);
                // Decrease reputation for failed consensus
                if (validator.reputation > 10) {
                    validator.reputation = validator.reputation.sub(10); // -0.1%
                }
            }
        }
    }

    /**
     * @dev Calculate consensus hash for block integrity
     */
    function _calculateConsensusHash(
        uint256 blockHeight,
        uint256 agreementScore,
        uint256 totalStake
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            blockHeight,
            agreementScore,
            totalStake,
            block.timestamp,
            address(this)
        ));
    }

    /**
     * @dev Remove validator from active validators array
     */
    function _removeValidatorFromArray(address validatorAddr) internal {
        for (uint i = 0; i < validatorAddresses.length; i++) {
            if (validatorAddresses[i] == validatorAddr) {
                validatorAddresses[i] = validatorAddresses[validatorAddresses.length - 1];
                validatorAddresses.pop();
                break;
            }
        }
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @dev Authorize ML oracle for consensus calculation
     */
    function setMLOracle(address oracle, bool authorized) external onlyOwner {
        authorizedMLOracles[oracle] = authorized;
        emit MLOracleUpdated(oracle, authorized);
    }

    /**
     * @dev Slash validator for malicious behavior
     */
    function slashValidator(
        address validatorAddr, 
        uint256 slashAmount, 
        string memory reason
    ) external onlyOwner {
        require(validators[validatorAddr].isActive, "Validator not active");
        require(slashAmount <= validators[validatorAddr].stake, "Slash amount exceeds stake");

        validators[validatorAddr].stake = validators[validatorAddr].stake.sub(slashAmount);
        totalNetworkStake = totalNetworkStake.sub(slashAmount);

        // If stake falls below minimum, deactivate validator
        if (validators[validatorAddr].stake < MIN_STAKE) {
            validators[validatorAddr].isActive = false;
            activeValidatorCount = activeValidatorCount.sub(1);
            _removeValidatorFromArray(validatorAddr);
        }

        emit ValidatorSlashed(validatorAddr, slashAmount, reason);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get validator information
     */
    function getValidator(address validatorAddr) 
        external 
        view 
        returns (
            uint256 stake,
            string memory biometricDevice,
            uint256 reputation,
            uint256 totalBlocks,
            uint256 missedBlocks,
            bool isActive
        ) 
    {
        Validator storage validator = validators[validatorAddr];
        return (
            validator.stake,
            validator.biometricDevice,
            validator.reputation,
            validator.totalBlocks,
            validator.missedBlocks,
            validator.isActive
        );
    }

    /**
     * @dev Get consensus block information
     */
    function getConsensusBlock(uint256 blockHeight)
        external
        view
        returns (
            uint256 timestamp,
            uint256 networkStress,
            uint256 networkEnergy,
            uint256 networkFocus,
            uint256 networkAuthenticity,
            uint256 agreementScore,
            uint256 participatingValidators,
            bool consensusReached
        )
    {
        ConsensusBlock storage cb = consensusBlocks[blockHeight];
        return (
            cb.timestamp,
            cb.networkStress,
            cb.networkEnergy,
            cb.networkFocus,
            cb.networkAuthenticity,
            cb.agreementScore,
            cb.participatingValidators,
            cb.consensusReached
        );
    }

    /**
     * @dev Get emotional proofs for a block
     */
    function getEmotionalProofs(uint256 blockHeight) 
        external 
        view 
        returns (EmotionalProof[] memory) 
    {
        return blockEmotionalProofs[blockHeight];
    }

    /**
     * @dev Get network statistics
     */
    function getNetworkStats()
        external
        view
        returns (
            uint256 totalValidators,
            uint256 totalStake,
            uint256 currentBlock,
            uint256 lastConsensusTime
        )
    {
        uint256 lastConsensusTime = 0;
        if (recentBlocks.length > 0) {
            uint256 lastBlockHeight = recentBlocks[recentBlocks.length - 1];
            lastConsensusTime = consensusBlocks[lastBlockHeight].timestamp;
        }

        return (
            activeValidatorCount,
            totalNetworkStake,
            currentBlockHeight,
            lastConsensusTime
        );
    }

    /**
     * @dev Get active validator addresses
     */
    function getActiveValidators() external view returns (address[] memory) {
        address[] memory activeValidators = new address[](activeValidatorCount);
        uint256 index = 0;
        
        for (uint i = 0; i < validatorAddresses.length; i++) {
            if (validators[validatorAddresses[i]].isActive) {
                activeValidators[index] = validatorAddresses[i];
                index++;
            }
        }
        
        return activeValidators;
    }
}