// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title BiometricValidator
 * @dev Smart contract for validating biometric signatures and anti-spoofing
 * @author EmotionalChain Technologies
 * @notice Validates biometric data authenticity for PoE consensus
 */
contract BiometricValidator is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============ STRUCTURES ============

    struct BiometricDevice {
        string deviceType;
        string manufacturer;
        bytes32 publicKeyHash;
        bool isAuthorized;
        uint256 registeredAt;
        uint256 validationCount;
    }

    struct ValidationRecord {
        address validator;
        bytes32 biometricHash;
        uint256 timestamp;
        bool isValid;
        uint256 authenticityScore;
        string deviceType;
    }

    // ============ STATE VARIABLES ============

    // Device management
    mapping(address => BiometricDevice) public registeredDevices;
    mapping(bytes32 => bool) public authorizedDeviceHashes;
    mapping(string => bool) public supportedDeviceTypes;
    
    // Validation tracking
    mapping(bytes32 => ValidationRecord) public validationRecords;
    mapping(address => bytes32[]) public userValidationHistory;
    mapping(address => uint256) public userValidationCount;
    
    // Anti-spoofing parameters
    uint256 public constant MIN_AUTHENTICITY_SCORE = 8000; // 80.00%
    uint256 public constant MAX_VALIDATION_AGE = 300;      // 5 minutes
    uint256 public constant MIN_TIME_BETWEEN_VALIDATIONS = 10; // 10 seconds
    
    // Authorized signers for ML oracles
    mapping(address => bool) public authorizedMLOracles;
    mapping(address => uint256) public lastValidationTime;

    // ============ EVENTS ============

    event BiometricDeviceRegistered(
        address indexed user,
        string deviceType,
        string manufacturer,
        bytes32 publicKeyHash
    );

    event BiometricValidationCompleted(
        address indexed validator,
        bytes32 biometricHash,
        bool isValid,
        uint256 authenticityScore,
        string deviceType
    );

    event MLOracleAuthorized(
        address indexed oracle,
        bool authorized
    );

    event DeviceTypeUpdated(
        string deviceType,
        bool supported
    );

    event SpoofingAttemptDetected(
        address indexed validator,
        bytes32 biometricHash,
        string reason
    );

    // ============ MODIFIERS ============

    modifier onlyAuthorizedMLOracle() {
        require(authorizedMLOracles[msg.sender], "Not authorized ML oracle");
        _;
    }

    modifier validValidationInterval(address validator) {
        require(
            block.timestamp >= lastValidationTime[validator] + MIN_TIME_BETWEEN_VALIDATIONS,
            "Validation too frequent"
        );
        _;
    }

    // ============ CONSTRUCTOR ============

    constructor() {
        // Initialize supported device types
        supportedDeviceTypes["Apple_Watch"] = true;
        supportedDeviceTypes["Fitbit"] = true;
        supportedDeviceTypes["Samsung_Galaxy_Watch"] = true;
        supportedDeviceTypes["Garmin"] = true;
        supportedDeviceTypes["Polar"] = true;
        supportedDeviceTypes["Whoop"] = true;
        supportedDeviceTypes["Oura_Ring"] = true;
        supportedDeviceTypes["AI_Sensor_v2"] = true; // For testing
    }

    // ============ DEVICE REGISTRATION ============

    /**
     * @dev Register a biometric device for a user
     * @param deviceType Type of biometric device
     * @param manufacturer Device manufacturer
     * @param publicKeyHash Hash of device's public key
     */
    function registerBiometricDevice(
        string memory deviceType,
        string memory manufacturer,
        bytes32 publicKeyHash
    ) external {
        require(supportedDeviceTypes[deviceType], "Unsupported device type");
        require(bytes(manufacturer).length > 0, "Manufacturer required");
        require(publicKeyHash != bytes32(0), "Invalid public key hash");
        require(!registeredDevices[msg.sender].isAuthorized, "Device already registered");

        // Register device
        registeredDevices[msg.sender] = BiometricDevice({
            deviceType: deviceType,
            manufacturer: manufacturer,
            publicKeyHash: publicKeyHash,
            isAuthorized: true,
            registeredAt: block.timestamp,
            validationCount: 0
        });

        authorizedDeviceHashes[publicKeyHash] = true;

        emit BiometricDeviceRegistered(msg.sender, deviceType, manufacturer, publicKeyHash);
    }

    /**
     * @dev Update device public key (for key rotation)
     * @param newPublicKeyHash New public key hash
     */
    function updateDeviceKey(bytes32 newPublicKeyHash) external {
        require(registeredDevices[msg.sender].isAuthorized, "Device not registered");
        require(newPublicKeyHash != bytes32(0), "Invalid public key hash");

        // Remove old key authorization
        bytes32 oldKeyHash = registeredDevices[msg.sender].publicKeyHash;
        authorizedDeviceHashes[oldKeyHash] = false;

        // Update to new key
        registeredDevices[msg.sender].publicKeyHash = newPublicKeyHash;
        authorizedDeviceHashes[newPublicKeyHash] = true;
    }

    // ============ BIOMETRIC VALIDATION ============

    /**
     * @dev Verify biometric signature for authentication
     * @param validator Address of the validator
     * @param biometricHash Hash of biometric data
     * @param signature Cryptographic signature from biometric device
     * @return isValid Whether the signature is valid
     */
    function verifyBiometricSignature(
        address validator,
        bytes32 biometricHash,
        bytes memory signature
    ) external validValidationInterval(validator) returns (bool isValid) {
        require(registeredDevices[validator].isAuthorized, "Device not registered");
        require(biometricHash != bytes32(0), "Invalid biometric hash");
        require(signature.length > 0, "Invalid signature");

        // Create message hash for signature verification
        bytes32 messageHash = keccak256(abi.encodePacked(
            validator,
            biometricHash,
            block.timestamp
        ));
        
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

        // Recover signer from signature
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        
        // For simplicity, we'll validate against the validator address
        // In production, this would validate against the device's public key
        isValid = (recoveredSigner == validator);

        // Update validation tracking
        lastValidationTime[validator] = block.timestamp;
        registeredDevices[validator].validationCount++;

        // Record validation
        ValidationRecord memory record = ValidationRecord({
            validator: validator,
            biometricHash: biometricHash,
            timestamp: block.timestamp,
            isValid: isValid,
            authenticityScore: isValid ? 9500 : 0, // Simplified authenticity score
            deviceType: registeredDevices[validator].deviceType
        });

        validationRecords[biometricHash] = record;
        userValidationHistory[validator].push(biometricHash);
        userValidationCount[validator]++;

        emit BiometricValidationCompleted(
            validator,
            biometricHash,
            isValid,
            record.authenticityScore,
            record.deviceType
        );

        return isValid;
    }

    /**
     * @dev Advanced biometric validation with ML-enhanced anti-spoofing
     * @param validator Address of the validator
     * @param biometricHash Hash of biometric data
     * @param heartRate Heart rate measurement
     * @param hrv Heart rate variability
     * @param skinConductance Skin conductance measurement
     * @param movement Movement/acceleration data
     * @param signature Cryptographic signature
     * @return isValid Whether validation passed
     * @return authenticityScore Calculated authenticity score (0-10000)
     */
    function advancedBiometricValidation(
        address validator,
        bytes32 biometricHash,
        uint256 heartRate,
        uint256 hrv,
        uint256 skinConductance,
        uint256 movement,
        bytes memory signature
    ) external onlyAuthorizedMLOracle returns (bool isValid, uint256 authenticityScore) {
        require(registeredDevices[validator].isAuthorized, "Device not registered");

        // Basic signature verification
        bool signatureValid = _verifySignature(validator, biometricHash, signature);
        if (!signatureValid) {
            emit SpoofingAttemptDetected(validator, biometricHash, "Invalid signature");
            return (false, 0);
        }

        // Calculate authenticity score using biometric correlation analysis
        authenticityScore = _calculateAuthenticityScore(
            heartRate,
            hrv,
            skinConductance,
            movement
        );

        // Check for spoofing patterns
        bool spoofingDetected = _detectSpoofingPatterns(
            validator,
            heartRate,
            hrv,
            skinConductance,
            movement
        );

        if (spoofingDetected) {
            authenticityScore = authenticityScore / 2; // Reduce score for suspicious patterns
            emit SpoofingAttemptDetected(validator, biometricHash, "Suspicious biometric patterns");
        }

        isValid = authenticityScore >= MIN_AUTHENTICITY_SCORE;

        // Record detailed validation
        ValidationRecord memory record = ValidationRecord({
            validator: validator,
            biometricHash: biometricHash,
            timestamp: block.timestamp,
            isValid: isValid,
            authenticityScore: authenticityScore,
            deviceType: registeredDevices[validator].deviceType
        });

        validationRecords[biometricHash] = record;
        userValidationHistory[validator].push(biometricHash);
        userValidationCount[validator]++;

        // Update device validation count
        registeredDevices[validator].validationCount++;

        emit BiometricValidationCompleted(
            validator,
            biometricHash,
            isValid,
            authenticityScore,
            record.deviceType
        );

        return (isValid, authenticityScore);
    }

    // ============ INTERNAL VALIDATION FUNCTIONS ============

    /**
     * @dev Verify cryptographic signature
     */
    function _verifySignature(
        address validator,
        bytes32 biometricHash,
        bytes memory signature
    ) internal view returns (bool) {
        bytes32 messageHash = keccak256(abi.encodePacked(
            validator,
            biometricHash,
            block.timestamp / 100 // Round to nearest 100 seconds for some flexibility
        ));
        
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        
        return recoveredSigner == validator;
    }

    /**
     * @dev Calculate authenticity score based on biometric correlations
     */
    function _calculateAuthenticityScore(
        uint256 heartRate,
        uint256 hrv,
        uint256 skinConductance,
        uint256 movement
    ) internal pure returns (uint256 score) {
        score = 10000; // Start with perfect score

        // Heart rate validation (40-200 BPM range)
        if (heartRate < 4000 || heartRate > 20000) {
            score -= 4000; // -40% for impossible HR
        } else if (heartRate < 5000 || heartRate > 15000) {
            score -= 1000; // -10% for suspicious HR
        }

        // HRV validation (5-100 ms range)
        if (hrv < 500 || hrv > 10000) {
            score -= 2000; // -20% for impossible HRV
        }

        // Skin conductance validation (0-1.0 range)
        if (skinConductance > 10000) {
            score -= 2000; // -20% for impossible GSR
        }

        // Movement validation (0-1.0 range)
        if (movement > 10000) {
            score -= 1000; // -10% for impossible movement
        }

        // Correlation checks
        // High HR with very high HRV is physiologically unlikely
        if (heartRate > 12000 && hrv > 6000) {
            score -= 3000; // -30% for unlikely HR/HRV combination
        }

        // Very high HR with no movement is suspicious
        if (heartRate > 14000 && movement < 500) {
            score -= 2500; // -25% for suspicious HR/movement combination
        }

        // Perfect round numbers are suspicious
        if (heartRate % 1000 == 0 && hrv % 1000 == 0) {
            score -= 1500; // -15% for too regular values
        }

        return score > 0 ? score : 0;
    }

    /**
     * @dev Detect spoofing patterns in biometric data
     */
    function _detectSpoofingPatterns(
        address validator,
        uint256 heartRate,
        uint256 hrv,
        uint256 skinConductance,
        uint256 movement
    ) internal view returns (bool spoofingDetected) {
        // Check historical patterns for this validator
        bytes32[] memory history = userValidationHistory[validator];
        
        if (history.length >= 3) {
            // Check for repeated identical values (indicating data replay)
            ValidationRecord memory lastRecord = validationRecords[history[history.length - 1]];
            ValidationRecord memory secondLastRecord = validationRecords[history[history.length - 2]];
            
            // If last two validations are identical, flag as suspicious
            if (lastRecord.biometricHash == secondLastRecord.biometricHash) {
                return true;
            }
        }

        // Check for impossible physiological combinations
        if (heartRate > 18000 && skinConductance < 1000) {
            return true; // Very high stress with very low conductance is impossible
        }

        // Check for artificial regularity
        if (heartRate % 500 == 0 && hrv % 500 == 0 && skinConductance % 1000 == 0) {
            return true; // Too many round numbers
        }

        return false;
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @dev Authorize ML oracle for advanced validation
     */
    function setMLOracleAuthorization(address oracle, bool authorized) external onlyOwner {
        authorizedMLOracles[oracle] = authorized;
        emit MLOracleAuthorized(oracle, authorized);
    }

    /**
     * @dev Update supported device types
     */
    function setSupportedDeviceType(string memory deviceType, bool supported) external onlyOwner {
        supportedDeviceTypes[deviceType] = supported;
        emit DeviceTypeUpdated(deviceType, supported);
    }

    /**
     * @dev Revoke device authorization (for compromised devices)
     */
    function revokeDeviceAuthorization(address user) external onlyOwner {
        require(registeredDevices[user].isAuthorized, "Device not authorized");
        
        BiometricDevice storage device = registeredDevices[user];
        device.isAuthorized = false;
        authorizedDeviceHashes[device.publicKeyHash] = false;
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get device information for a user
     */
    function getDeviceInfo(address user) 
        external 
        view 
        returns (
            string memory deviceType,
            string memory manufacturer,
            bool isAuthorized,
            uint256 registeredAt,
            uint256 validationCount
        ) 
    {
        BiometricDevice storage device = registeredDevices[user];
        return (
            device.deviceType,
            device.manufacturer,
            device.isAuthorized,
            device.registeredAt,
            device.validationCount
        );
    }

    /**
     * @dev Get validation record by biometric hash
     */
    function getValidationRecord(bytes32 biometricHash)
        external
        view
        returns (
            address validator,
            uint256 timestamp,
            bool isValid,
            uint256 authenticityScore,
            string memory deviceType
        )
    {
        ValidationRecord storage record = validationRecords[biometricHash];
        return (
            record.validator,
            record.timestamp,
            record.isValid,
            record.authenticityScore,
            record.deviceType
        );
    }

    /**
     * @dev Get validation history for a user
     */
    function getValidationHistory(address user) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return userValidationHistory[user];
    }

    /**
     * @dev Check if device type is supported
     */
    function isDeviceTypeSupported(string memory deviceType) 
        external 
        view 
        returns (bool) 
    {
        return supportedDeviceTypes[deviceType];
    }

    /**
     * @dev Get user validation statistics
     */
    function getUserValidationStats(address user)
        external
        view
        returns (
            uint256 totalValidations,
            uint256 successfulValidations,
            uint256 averageAuthenticityScore,
            uint256 lastValidationTimestamp
        )
    {
        totalValidations = userValidationCount[user];
        if (totalValidations == 0) return (0, 0, 0, 0);

        bytes32[] memory history = userValidationHistory[user];
        uint256 successCount = 0;
        uint256 totalAuthenticityScore = 0;

        for (uint i = 0; i < history.length; i++) {
            ValidationRecord storage record = validationRecords[history[i]];
            if (record.isValid) {
                successCount++;
            }
            totalAuthenticityScore += record.authenticityScore;
        }

        successfulValidations = successCount;
        averageAuthenticityScore = totalAuthenticityScore / totalValidations;
        lastValidationTimestamp = lastValidationTime[user];
    }
}