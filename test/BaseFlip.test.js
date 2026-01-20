const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, network } = hre;

describe("BaseFlip", function () {
    let baseFlip, owner, player;

    beforeEach(async function () {
        [owner, player] = await ethers.getSigners();

        // Deploy BaseFlip
        const BaseFlip = await ethers.getContractFactory("BaseFlip");
        baseFlip = await BaseFlip.deploy();
        await baseFlip.waitForDeployment();
    });

    it("should deploy correctly", async function () {
        expect(await baseFlip.owner()).to.equal(owner.address);
    });

    it("should revert if bet amount is below minimum (0.0006 ETH)", async function () {
        const tooSmallAmount = ethers.parseEther("0.0005");

        await expect(
            baseFlip.connect(player).flip(true, { value: tooSmallAmount })
        ).to.be.revertedWith("Bet too small");
    });

    it("should pay out 1.97x on win and emit events correctly", async function () {
        const betAmount = ethers.parseEther("0.1");
        const initialContractFunding = ethers.parseEther("1.0");

        // Fund the contract so it can pay out wins
        await owner.sendTransaction({
            to: await baseFlip.getAddress(),
            value: initialContractFunding
        });

        // Fix timestamp and prevrandao for deterministic seed
        const timestamp = 1800000000;
        await network.provider.send("evm_setNextBlockTimestamp", [timestamp]);
        await network.provider.send("hardhat_setPrevRandao", ["0x0000000000000000000000000000000000000000000000000000000000000001"]);

        const playerBalanceBefore = await ethers.provider.getBalance(player.address);
        const contractBalanceBefore = await ethers.provider.getBalance(await baseFlip.getAddress());

        // Place bet on heads (true)
        const tx = await baseFlip.connect(player).flip(true, { value: betAmount });
        const receipt = await tx.wait();
        const gasUsed = receipt.fee;

        // Check outcome
        const flipOutcomeLog = baseFlip.interface.parseLog(receipt.logs.find(log => {
            try { return baseFlip.interface.parseLog(log).name === "FlipOutcome"; } catch { return false; }
        }));

        const { won, payout } = flipOutcomeLog.args;
        const playerBalanceAfter = await ethers.provider.getBalance(player.address);
        const contractBalanceAfter = await ethers.provider.getBalance(await baseFlip.getAddress());
        const expectedPayout = (betAmount * 197n) / 100n;

        if (won) {
            // BalanceAfter = BalanceBefore - Bet - Gas + Payout
            expect(playerBalanceAfter).to.equal(playerBalanceBefore - gasUsed - betAmount + expectedPayout);
            expect(contractBalanceAfter).to.equal(contractBalanceBefore + betAmount - expectedPayout);
            expect(payout).to.equal(expectedPayout);
        } else {
            // BalanceAfter = BalanceBefore - Bet - Gas
            expect(playerBalanceAfter).to.equal(playerBalanceBefore - gasUsed - betAmount);
            expect(contractBalanceAfter).to.equal(contractBalanceBefore + betAmount);
            expect(payout).to.equal(0);
        }
    });

    it("should allow owner to withdraw ETH and revert for non-owner", async function () {
        const fundingAmount = ethers.parseEther("0.5");

        // Fund contract
        await owner.sendTransaction({
            to: await baseFlip.getAddress(),
            value: fundingAmount
        });

        const contractBalanceBefore = await ethers.provider.getBalance(await baseFlip.getAddress());

        const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
        const tx = await baseFlip.connect(owner).withdraw(contractBalanceBefore);
        const receipt = await tx.wait();
        const gasUsed = receipt.fee;

        const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
        const contractBalanceAfter = await ethers.provider.getBalance(await baseFlip.getAddress());

        expect(contractBalanceAfter).to.equal(0);
        expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + contractBalanceBefore - gasUsed);

        // Non-owner try -> revert
        await expect(
            baseFlip.connect(player).withdraw(ethers.parseEther("0.1"))
        ).to.be.reverted;
    });
});
