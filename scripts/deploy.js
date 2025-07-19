const { ethers } = require("hardhat");

async function main() {
  console.log("🧠 EmotionalChain Smart Contract Deployment");
  console.log("=" * 50);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  // Deploy EmotionToken first
  console.log("\n1️⃣ Deploying EmotionToken...");
  const EmotionToken = await ethers.getContractFactory("EmotionToken");
  const emotionToken = await EmotionToken.deploy();
  await emotionToken.deployed();
  console.log("✅ EmotionToken deployed to:", emotionToken.address);

  // Deploy BiometricValidator
  console.log("\n2️⃣ Deploying BiometricValidator...");
  const BiometricValidator = await ethers.getContractFactory("BiometricValidator");
  const biometricValidator = await BiometricValidator.deploy();
  await biometricValidator.deployed();
  console.log("✅ BiometricValidator deployed to:", biometricValidator.address);

  // Deploy ProofOfEmotionCore
  console.log("\n3️⃣ Deploying ProofOfEmotionCore...");
  const ProofOfEmotionCore = await ethers.getContractFactory("ProofOfEmotionCore");
  const poeCore = await ProofOfEmotionCore.deploy(
    emotionToken.address,
    biometricValidator.address
  );
  await poeCore.deployed();
  console.log("✅ ProofOfEmotionCore deployed to:", poeCore.address);

  // Setup initial configuration
  console.log("\n4️⃣ Setting up initial configuration...");

  // Authorize PoE contract as ML Oracle for biometric validation
  console.log("🔧 Authorizing PoE contract as ML Oracle...");
  await biometricValidator.setMLOracleAuthorization(poeCore.address, true);
  console.log("✅ PoE contract authorized as ML Oracle");

  // Set PoE contract as ML Oracle in core contract
  console.log("🔧 Setting ML Oracle in PoE core...");
  await poeCore.setMLOracle(deployer.address, true); // Deployer as ML Oracle for testing
  console.log("✅ ML Oracle configured");

  // Transfer some tokens to PoE contract for testing
  console.log("🔧 Setting up test environment...");
  const testAmount = ethers.utils.parseEther("100000"); // 100,000 tokens
  await emotionToken.transfer(deployer.address, testAmount);
  console.log("✅ Test tokens allocated");

  // Display contract addresses
  console.log("\n📋 DEPLOYMENT SUMMARY:");
  console.log("=".repeat(50));
  console.log("🪙 EmotionToken:", emotionToken.address);
  console.log("🔐 BiometricValidator:", biometricValidator.address);
  console.log("🧠 ProofOfEmotionCore:", poeCore.address);
  console.log("👤 Deployer:", deployer.address);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      EmotionToken: emotionToken.address,
      BiometricValidator: biometricValidator.address,
      ProofOfEmotionCore: poeCore.address
    },
    deploymentTime: new Date().toISOString(),
    configuration: {
      minStake: "10000",
      consensusThreshold: "67",
      minValidators: "3",
      maxValidators: "21",
      validationWindow: "300"
    }
  };

  // Write deployment info to file
  const fs = require("fs");
  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("✅ Deployment info saved to deployment-info.json");

  // Display interaction instructions
  console.log("\n🚀 NEXT STEPS:");
  console.log("=".repeat(50));
  console.log("1. Register as validator:");
  console.log(`   emotionToken.approve("${poeCore.address}", "10000000000000000000000")`);
  console.log(`   poeCore.registerValidator("10000000000000000000000", "AI_Sensor_v2")`);
  
  console.log("\n2. Register biometric device:");
  console.log(`   biometricValidator.registerBiometricDevice("AI_Sensor_v2", "EmotionalChain", "0x...")`);
  
  console.log("\n3. Submit emotional proof:");
  console.log(`   poeCore.submitEmotionalProof(1, 7500, 4500, 2000, 7000, 8500, 9000, "0x...", "0x...", true, "focused", 8500)`);
  
  console.log("\n4. Calculate consensus:");
  console.log(`   poeCore.calculateConsensus(1)`);

  console.log("\n✅ EmotionalChain smart contracts deployed successfully!");
  console.log("🧠 World's first AI-powered emotional blockchain is ready!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });