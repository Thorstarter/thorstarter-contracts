//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IVoters.sol";
import "./interfaces/IERC677Receiver.sol";

interface ITiers {
    function userInfos(address user) external view returns (uint256, uint256);
    function userInfoTotal(address user) external view returns (uint256, uint256);
}

contract SaleFcfs is IERC677Receiver, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Represents a sale participant
    struct UserInfo {
        // Amount of payment token deposited / purchased
        uint amount;
        // Wether they already claimed their tokens
        bool claimed;
    }

    uint public constant PRECISION = 1e8;
    // Time alloted to claim tiers allocations
    uint public constant ALLOCATION_DURATION = 14400; // 4 hours
    // The raising token
    IERC20 public paymentToken;
    // The offering token
    IERC20 public offeringToken;
    // The time (unix seconds) when sale starts
    uint public startTime;
    // The time (unix security) when sale ends
    uint public endTime;
    // Total amount of raising tokens that need to be raised
    uint public raisingAmount;
    // Total amount of offeringToken that will be offered
    uint public offeringAmount;
    // Maximum a user can contribute
    uint public perUserCap;
    // Wether deposits are paused
    bool public paused;
    // Wether the sale is finalized
    bool public finalized;
    // Total amount of raising tokens that have already been raised
    uint public totalAmount;
    // User's participation info
    mapping(address => UserInfo) public userInfo;
    // Participants list
    address[] public addressList;
    // Tiers: Contract
    ITiers public tiers;
    // Tiers: Size of guaranteed allocation
    uint public tiersAllocation;
    // Tiers: levels
    uint[] public tiersLevels;
    // Tiers: multipliers
    uint[] public tiersMultipliers;

    event Deposit(address indexed user, uint amount);
    event Harvest(address indexed user, uint amount);

    constructor(
        address _paymentToken,
        address _offeringToken,
        uint _startTime,
        uint _endTime,
        uint _offeringAmount,
        uint _raisingAmount,
        uint _perUserCap
    ) Ownable() {
        paymentToken = IERC20(_paymentToken);
        offeringToken = IERC20(_offeringToken);
        startTime = _startTime;
        endTime = _endTime;
        offeringAmount = _offeringAmount;
        raisingAmount = _raisingAmount;
        perUserCap = _perUserCap;
        require(_paymentToken != address(0) && _offeringToken != address(0), "!zero");
        require(_paymentToken != _offeringToken, "payment != offering");
        require(_offeringAmount > 0, "offering > 0");
        require(_raisingAmount > 0, "raising > 0");
        require(_startTime > block.timestamp, "start > now");
        require(_startTime + ALLOCATION_DURATION < _endTime, "start < end");
        require(_startTime < 10000000000, "start time not unix");
        require(_endTime < 10000000000, "start time not unix");
    }

    function configureTiers(
        address tiersContract,
        uint allocation,
        uint[] calldata levels,
        uint[] calldata multipliers
    ) public onlyOwner {
        tiers = ITiers(tiersContract);
        tiersAllocation = allocation;
        tiersLevels = levels;
        tiersMultipliers = multipliers;
    }

    function setRaisingAmount(uint amount) public onlyOwner {
      require(block.timestamp < startTime && totalAmount == 0, "sale started");
      raisingAmount = amount;
    }

    function togglePaused() public onlyOwner {
        paused = !paused;
    }

    function finalize() public {
        require(msg.sender == owner() || block.timestamp > endTime + 14 days, "not allowed");
        finalized = true;
    }

    function getAddressListLength() external view returns (uint) {
        return addressList.length;
    }

    function getParams() external view returns (uint, uint, uint, uint, uint, uint, bool, bool) {
        return (startTime, endTime, raisingAmount, offeringAmount, perUserCap, totalAmount, paused, finalized);
    }

    function getTiersParams() external view returns (uint, uint[] memory, uint[] memory) {
        return (tiersAllocation, tiersLevels, tiersMultipliers);
    }

    function getOfferingAmount(address _user) public view returns (uint) {
        return (userInfo[_user].amount * offeringAmount) / raisingAmount;
    }

    function getUserAllocation(address user) public view returns (uint) {
        uint allocation = 0;

        // Allocation is zero if user just joined/changed tiers
        (, uint lastAction) = tiers.userInfos(user);
        if (lastAction >= startTime) {
          return allocation;
        }

        // Find the highest tiers and use that allocation amount
        (, uint tiersTotal) = tiers.userInfoTotal(user);
        for (uint i = 0; i < tiersLevels.length; i++) {
            if (tiersTotal >= tiersLevels[i]) {
                allocation = (tiersAllocation * tiersMultipliers[i]) / PRECISION;
            }
        }
        return allocation;
    }

    function _deposit(address user, uint amount) private nonReentrant {
        require(!paused, "paused");
        require(block.timestamp >= startTime && block.timestamp <= endTime, "sale not active");
        require(amount > 0, "need amount > 0");
        require(perUserCap == 0 || userInfo[user].amount + amount <= perUserCap, "over per user cap");
        require(totalAmount < raisingAmount, "sold out");

        if (userInfo[user].amount == 0) {
            addressList.push(address(user));
        }

        // Check tiers and cap purchase to allocation
        if (block.timestamp < startTime + ALLOCATION_DURATION) {
            uint allocation = getUserAllocation(user);
            require(userInfo[user].amount + amount <= allocation, "over allocation size");
        }

        // Refund any payment amount that would bring up over the raising amount
        if (totalAmount + amount > raisingAmount) {
            paymentToken.safeTransfer(user, (totalAmount+amount)-raisingAmount);
            amount = raisingAmount - totalAmount;
        }

        userInfo[user].amount = userInfo[user].amount + amount;
        totalAmount = totalAmount + amount;
        emit Deposit(user, amount);
    }

    function deposit(uint amount) public {
        _transferFrom(msg.sender, amount);
        _deposit(msg.sender, amount);
    }

    function onTokenTransfer(address user, uint amount, bytes calldata _data) public override {
        require(msg.sender == address(paymentToken), "onTokenTransfer: not paymentToken");
        _deposit(user, amount);
    }

    function harvest() public nonReentrant {
        require(!paused, "paused");
        require(block.timestamp > endTime, "sale not ended");
        require(finalized, "not finalized");
        require(userInfo[msg.sender].amount > 0, "have you participated?");
        require(!userInfo[msg.sender].claimed, "nothing to harvest");
        userInfo[msg.sender].claimed = true;
        uint amount = getOfferingAmount(msg.sender);
        offeringToken.safeTransfer(address(msg.sender), amount);
        emit Harvest(msg.sender, amount);
    }

    function withdrawToken(address token, uint amount) public onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    function _transferFrom(address from, uint amount) private {
        uint balanceBefore = paymentToken.balanceOf(address(this));
        paymentToken.safeTransferFrom(from, address(this), amount);
        uint balanceAfter = paymentToken.balanceOf(address(this));
        require(balanceAfter - balanceBefore == amount, "_transferFrom: balance change does not match amount");
    }
}
