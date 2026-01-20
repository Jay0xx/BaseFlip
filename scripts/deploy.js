const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying native ETH BaseFlip with account:", deployer.address);

    const BaseFlip = await hre.ethers.getContractFactory("BaseFlip");
    const baseFlip = await BaseFlip.deploy();

    await baseFlip.waitForDeployment();

    const deployedAddress = await baseFlip.getAddress();
    console.log("BaseFlip (Native ETH) deployed to:", deployedAddress);

    // Optional: Verify on Basescan Sepolia
    if (hre.network.name === "baseSepolia" && process.env.BASESCAN_API_KEY) {
        console.log("Waiting 30 seconds before verification...");
        await new Promise(resolve => setTimeout(resolve, 30000));
        try {
            await hre.run("verify:verify", {
                address: deployedAddress,
                constructorArguments: [],
            });
            console.log("Verification successful!");
        } catch (error) {
            console.error("Verification failed:", error.message);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
