// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title EmotionToken
 * @dev ERC20 token for the EmotionalChain Proof of Emotion ecosystem
 * @author EmotionalChain Technologies
 * @notice EMOTION token used for staking in PoE consensus mechanism
 */
contract EmotionToken is ERC20, ERC20Burnable, Ownable, Pausable {
    
    // ============ CONSTANTS ============
    
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant MIN_STAKE_AMOUNT = 10_000 * 10**18;    // 10,000 tokens
    
    // ============ STATE VARIABLES ============
    
    // Staking and rewards
    mapping(address => uint256) public stakedBalances;
    mapping(address => uint256) public stakingTimestamps;
    mapping(address => uint256) public emotionalRewards;
    mapping(address => bool) public authorizedStakers;
    
    // Wellness incentives
    mapping(address => uint256) public wellnessScores;      // 0-10000 (0-100.00%)
    mapping(address => uint256) public authenticityScores;  // 0-10000 (0-100.00%)
    mapping(address => uint256) public lastRewardClaim;
    
    // Token distribution
    uint256 public stakingPoolBalance;
    uint256 public wellnessPoolBalance;
    uint256 public ecosystemPoolBalance;
    
    // Reward rates (per day, scaled by 10000)
    uint256 public baseStakingRate = 500;        // 5.00% annual (500/10000 * 365)
    uint256 public wellnessMultiplier = 150;     // 1.50x for high wellness
    uint256 public authenticityMultiplier = 200; // 2.00x for high authenticity
    
    // ============ EVENTS ============
    
    event TokensStaked(
        address indexed staker,
        uint256 amount,
        uint256 timestamp
    );
    
    event TokensUnstaked(
        address indexed staker,
        uint256 amount,
        uint256 rewards
    );
    
    event EmotionalRewardClaimed(
        address indexed recipient,
        uint256 amount,
        uint256 wellnessScore,
        uint256 authenticityScore
    );
    
    event WellnessScoreUpdated(
        address indexed user,
        uint256 oldScore,
        uint256 newScore
    );
    
    event AuthenticityScoreUpdated(
        address indexed user,
        uint256 oldScore,
        uint256 newScore
    );
    
    event RewardRatesUpdated(
        uint256 newStakingRate,
        uint256 newWellnessMultiplier,
        uint256 newAuthenticityMultiplier
    );

    // ============ MODIFIERS ============
    
    modifier onlyAuthorizedStaker() {
        require(authorizedStakers[msg.sender], "Not authorized to stake");
        _;
    }
    
    modifier hasStakedTokens() {
        require(stakedBalances[msg.sender] > 0, "No staked tokens");
        _;
    }

    // ============ CONSTRUCTOR ============
    
    constructor() ERC20("EmotionToken", "EMOTION") {
        // Initial token distribution
        uint256 stakingPool = TOTAL_SUPPLY * 40 / 100;      // 40% for staking rewards
        uint256 wellnessPool = TOTAL_SUPPLY * 20 / 100;     // 20% for wellness rewards
        uint256 ecosystemPool = TOTAL_SUPPLY * 25 / 100;    // 25% for ecosystem development
        uint256 teamAllocation = TOTAL_SUPPLY * 15 / 100;   // 15% for team (vested)
        
        // Mint tokens
        _mint(address(this), stakingPool + wellnessPool + ecosystemPool);
        _mint(owner(), teamAllocation);
        
        // Set pool balances
        stakingPoolBalance = stakingPool;
        wellnessPoolBalance = wellnessPool;
        ecosystemPoolBalance = ecosystemPool;
    }

    // ============ STAKING FUNCTIONS ============
    
    /**
     * @dev Stake tokens for PoE consensus participation
     * @param amount Amount of tokens to stake
     */
    function stakeTokens(uint256 amount) external whenNotPaused {
        require(amount >= MIN_STAKE_AMOUNT, "Below minimum stake amount");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Update staking records
        if (stakedBalances[msg.sender] == 0) {
            stakingTimestamps[msg.sender] = block.timestamp;
        }
        
        stakedBalances[msg.sender] += amount;
        
        // Authorize for PoE consensus participation
        if (!authorizedStakers[msg.sender]) {
            authorizedStakers[msg.sender] = true;
        }
        
        emit TokensStaked(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Unstake tokens and claim rewards
     * @param amount Amount of tokens to unstake (0 = all)
     */
    function unstakeTokens(uint256 amount) external hasStakedTokens whenNotPaused {
        uint256 stakedAmount = stakedBalances[msg.sender];
        
        if (amount == 0) {
            amount = stakedAmount;
        }
        
        require(amount <= stakedAmount, "Insufficient staked balance");
        require(amount >= MIN_STAKE_AMOUNT || amount == stakedAmount, "Must unstake minimum amount or all