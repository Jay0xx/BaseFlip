const hre = require("hardhat");

async function main() {
    // Note: Update this if you redeploy
    const deployedAddress = "0x091e25A02922cf956Fff137C77c5F2F4105fCF3a";

    const BaseFlip = await hre.ethers.getContractFactory("BaseFlip");
    const baseFlip = await BaseFlip.attach(deployedAddress);

    const [signer] = await hre.ethers.getSigners();
    console.log("Interacting with account:", signer.address);

    // 1. Check Balances
    const userBalance = await hre.ethers.provider.getBalance(signer.address);
    console.log("Your ETH balance:", hre.ethers.formatEther(userBalance), "ETH");

    const contractBalance = await hre.ethers.provider.getBalance(deployedAddress);
    console.log("Contract ETH balance:", hre.ethers.formatEther(contractBalance), "ETH");

    if (userBalance < hre.ethers.parseEther("0.01")) {
        console.log("Warning: Low ETH balance. You might not have enough for gas and bet.");
    }

    // 2. Place a test flip (0.001 ETH on heads)
    console.log("Placing 0.001 ETH bet on HEADS (true)...");
    const betAmount = hre.ethers.parseEther("0.001");

    try {
        const tx = await baseFlip.flip(true, { value: betAmount });
        console.log("Flip tx hash:", tx.hash);

        console.log("Waiting for confirmation...");
        const receipt = await tx.wait();

        // Parse events
        console.log("\n--- Flip Result ---");
        receipt.logs.forEach(log => {
            try {
                const parsed = baseFlip.interface.parseLog(log);
                if (parsed.name === "FlipOutcome") {
                    const { player, amount, isHeads, result, won, payout } = parsed.args;
                    console.log(`Outcome: ${result ? "HEADS" : "TAILS"}`);
                    console.log(`Result: ${won ? "WON" : "LOST"}`);
                    console.log(`Payout: ${hre.ethers.formatEther(payout)} ETH`);
                }
            } catch (e) {
                // Not a BaseFlip event or parse failed
            }
        });
    } catch (error) {
        console.error("Flip failed:", error.reason || error.message);
        if (error.message.includes("Inadequate contract liquidity")) {
            console.log("Advice: The contract doesn't have enough ETH to pay out a potential win.");
            console.log("Please fund the contract (e.g., send ETH to it) before betting.");
        }
    }

    console.log("\nDone – Check Basescan for full details.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
