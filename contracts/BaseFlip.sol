// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BaseFlip
 * @dev A simple coin flip dApp using native ETH for betting on Base.
 */
contract BaseFlip is Ownable, ReentrancyGuard {
    /// @dev Minimum bet ≈ $2 in ETH
    uint256 public constant MIN_BET = 0.0006 ether;
    /// @dev Payout multiplier (1.97x payout = 1.5% house edge)
    uint256 public constant PAYOUT_MULTIPLIER = 197;

    event BetPlaced(address indexed player, uint256 amount, bool isHeads);
    event FlipOutcome(
        address indexed player,
        uint256 amount,
        bool isHeads,
        bool result,
        bool won,
        uint256 payout
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Core flip function.
     * @param _isHeads The side chosen by the player (true = Heads, false = Tails).
     */
    function flip(bool _isHeads) external payable nonReentrant {
        uint256 _amount = msg.value;
        require(_amount >= MIN_BET, "Bet below minimum threshold");
        require(
            address(this).balance >= (_amount * PAYOUT_MULTIPLIER) / 100,
            "Insufficient contract liquidity"
        );

        // Security Notice: Pseudo-randomness used for Testnet demonstrator.
        // In Production environments, Chainlink VRF MUST be utilized to prevent miner manipulation.
        bytes32 seed = keccak256(
            abi.encodePacked(
                block.prevrandao,
                block.timestamp,
                msg.sender,
                _amount
            )
        );
        bool result = (uint256(seed) % 2 == 0); // true = Heads, false = Tails
        bool won = (_isHeads == result);

        uint256 payout = 0;
        if (won) {
            payout = (_amount * PAYOUT_MULTIPLIER) / 100;
        }

        // --- Effects ---
        emit BetPlaced(msg.sender, _amount, _isHeads);
        emit FlipOutcome(msg.sender, _amount, _isHeads, result, won, payout);

        // --- Interactions ---
        if (won) {
            (bool success, ) = msg.sender.call{value: payout}("");
            require(success, "Payout transfer failed");
        }
    }

    /**
     * @dev Allows the owner to withdraw accumulated fees/liquidity.
     * @param _amount The amount of ETH to withdraw.
     */
    function withdraw(uint256 _amount) external onlyOwner nonReentrant {
        require(_amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = owner().call{value: _amount}("");
        require(success, "Withdraw failed");
    }

    /**
     * @dev Allows anyone to fund the contract with ETH for liquidity.
     */
    receive() external payable {}
}
