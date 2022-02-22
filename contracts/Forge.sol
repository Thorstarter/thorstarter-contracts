// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ERC20Vote } from "./vendor/ERC20Vote.sol";

contract Forge is ERC20Vote, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Stake {
        uint256 amount;
        uint256 shares;
        uint256 lockTime;
        uint256 lockDays;
        bool unstaked;
    }

    IERC20 public token;
    mapping(address => Stake[]) public users;
    uint256 public totalUsers;
    uint256 public totalShares;
    uint256 public lockDaysMin;
    uint256 public lockDaysMax;
    uint256 public shareBonusPerYear;
    uint256 public shareBonusPerToken;

    event Staked(address indexed user, uint256 amount, uint256 lockDays, uint256 shares);
    event Unstaked(address indexed staker, uint256 stakeIndex, uint256 amount);
    event UnstakedEarly(address indexed staker, uint256 stakeIndex, uint256 amount, uint256 returned);

    constructor(
        IERC20 _token,
        uint16 _lockDaysMin,
        uint16 _lockDaysMax,
        uint16 _shareBonusPerYear,
        uint16 _shareBonusPerToken
    ) ERC20Vote("stakedXRUNE", "sXRUNE", 18) {
        token = _token;
        lockDaysMin = _lockDaysMin;
        lockDaysMax = _lockDaysMax;
        shareBonusPerYear = _shareBonusPerYear;
        shareBonusPerToken = _shareBonusPerToken;
    }

    function stake(uint256 amount, uint256 lockDays) external nonReentrant {
        require(lockDays >= lockDaysMin && lockDays <= lockDaysMax, "invalid lockDays");

        token.safeTransferFrom(msg.sender, address(this), amount);

        if (users[msg.sender].length == 0) {
            totalUsers += 1;
        }

        (uint256 shares,) = calculateShares(amount, lockDays);
        totalShares += shares;
        users[msg.sender].push(Stake({
            amount: amount,
            shares: shares,
            lockTime: uint48(block.timestamp),
            lockDays: lockDays,
            unstaked: false
        }));

        _mint(msg.sender, shares);

        emit Staked(msg.sender, amount, lockDays, shares);
    }

    function unstake(uint stakeIndex) external nonReentrant {
        require(stakeIndex < users[msg.sender].length, "invalid index");
        Stake storage stakeRef = users[msg.sender][stakeIndex];
        require(!stakeRef.unstaked, "already unstaked");
        require(stakeRef.lockTime + (stakeRef.lockDays * 86400) <= block.timestamp, "too early");

        totalShares -= stakeRef.shares;
        stakeRef.unstaked = true;
        _burn(msg.sender, stakeRef.shares);

        token.safeTransfer(msg.sender, stakeRef.amount);

        emit Unstaked(msg.sender, stakeIndex, stakeRef.amount);
    }

    function unstakeEarly(uint stakeIndex) external nonReentrant {
        require(stakeIndex < users[msg.sender].length, "invalid index");
        Stake storage stakeRef = users[msg.sender][stakeIndex];
        require(!stakeRef.unstaked, "already unstaked");
        require(block.timestamp < stakeRef.lockTime + (stakeRef.lockDays * 86400), "not early");


        totalShares -= stakeRef.shares;
        stakeRef.unstaked = true;
        _burn(msg.sender, stakeRef.shares);

        uint256 progress = ((block.timestamp - stakeRef.lockTime) * 1e12) / (stakeRef.lockDays * 86400);
        uint256 returned = (stakeRef.amount * progress) / 1e12;
        token.safeTransfer(msg.sender, returned);

        emit UnstakedEarly(msg.sender, stakeIndex, stakeRef.amount, returned);
    }

    function calculateShares(
        uint256 amount, uint256 lockDays
    ) public view returns (uint256, uint256) {
        uint256 longTermBonus = (amount * lockDays * shareBonusPerYear) / 365;
        uint256 stakingMoreBonus = (amount * amount * shareBonusPerToken) / 1e18;
        uint256 shares = amount + longTermBonus + stakingMoreBonus;
        return (shares, longTermBonus);
    }

    function getUserInfo(address user) public view returns (uint256, uint256, uint256) {
        uint256 totalAmount = 0;
        uint256 totalShares = 0;
        for (uint i = 0; i < users[user].length; i++) {
            Stake storage stakeRef = users[user][i];
            if (stakeRef.unstaked) continue;

            totalAmount += stakeRef.amount;
            totalShares += stakeRef.shares;
        }
        return (totalAmount, totalShares, users[user].length);
    }

    function userStakeCount(address user) public view returns (uint) {
        return users[user].length;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        revert("non-transferable");
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        revert("non-transferable");
    }
}
