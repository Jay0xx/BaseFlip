const hre = require("hardhat");

async function main() {
    const deployedAddress = "0x091e25A02922cf956Fff137C77c5F2F4105fCF3a";
    const [sender] = await hre.ethers.getSigners();

    console.log("Funding contract at:", deployedAddress);
    console.log("Account:", sender.address);

    const amount = hre.ethers.parseEther("0.05"); // Small amount for liquidity

    const tx = await sender.sendTransaction({
        to: deployedAddress,
        value: amount
    });

    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    console.log("Successfully funded contract with 0.05 ETH!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
