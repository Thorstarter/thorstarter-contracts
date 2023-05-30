//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SaleFcfsSimple is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct UserInfo {
        uint amount;
        uint claimed;
    }

    IERC20 public tokenRaising;
    IERC20 public tokenVesting;
    uint public amountRaising;
    uint public amountVesting;
    uint public timeStart;
    uint public timeClose;
    bool public paused = false;
    bool public finalized = false;
    uint public capPerUser = 1000e6;
    uint public vestingStart;
    uint public vestingInitial; // 1e18 = 100%
    uint public vestingDuration;
    uint public amountTotal = 0;
    address[] public addressList;
    mapping(address => UserInfo) public userInfo;

    event Deposit(address indexed user, uint amount);
    event Harvest(address indexed user, uint amount);

    constructor(
        address _tokenRaising,
        address _tokenVesting,
        uint _amountRaising,
        uint _amountVesting,
        uint _timeStart,
        uint _timeClose,
        uint _vestingInitial,
        uint _vestingDuration
    ) public Ownable() {
        tokenRaising = IERC20(_tokenRaising);
        tokenVesting = IERC20(_tokenVesting);
        amountRaising = _amountRaising;
        amountVesting = _amountVesting;
        timeStart = _timeStart;
        timeClose = _timeClose;
        vestingStart = _timeClose;
        vestingInitial = _vestingInitial;
        vestingDuration = _vestingDuration;
    }

    function setTokenVesting(address token) external onlyOwner {
        tokenVesting = IERC20(token);
    }

    function setCapPerUser(uint amount) external onlyOwner {
        capPerUser = amount;
    }

    function setTimeStart(uint time) external onlyOwner {
        timeStart = time;
    }

    function setTimeClose(uint time) external onlyOwner {
        timeClose = time;
    }

    function setAmountRaising(uint amount) external onlyOwner {
        require(block.timestamp < timeStart && amountTotal == 0, "sale started");
        amountRaising = amount;
    }

    function setAmountVesting(uint amount) external onlyOwner {
        require(block.timestamp < timeStart && amountTotal == 0, "sale started");
        amountVesting = amount;
    }

    function setVestingStart(uint value) external onlyOwner {
        vestingStart = value;
    }

    function setVestingInitial(uint value) external onlyOwner {
        vestingInitial = value;
    }

    function setVestingDuration(uint value) external onlyOwner {
        vestingDuration = value;
    }

    function togglePaused() external onlyOwner {
        paused = !paused;
    }

    function finalize() external onlyOwner {
        finalized = true;
    }

    function getAddressListLength() external view returns (uint) {
        return addressList.length;
    }

    function getParams() external view returns (uint, uint, uint, uint, uint, uint, bool, bool) {
        return (timeStart, timeClose, amountRaising, amountVesting, amountTotal, capPerUser, paused, finalized);
    }

    function getUserInfo(address user) public view returns (uint, uint, uint, uint) {
        UserInfo memory info = userInfo[user];
        uint owed = (info.amount * amountVesting) / amountRaising;
        uint progress = _min(block.timestamp - _min(block.timestamp, vestingStart), vestingDuration);
        uint claimable = (owed * vestingInitial) / 1e18;
        claimable += ((owed - claimable) * progress) / vestingDuration;
        return (info.amount, info.claimed, owed, claimable);
    }

    function deposit(uint amount) public nonReentrant {
        require(!paused, "paused");
        require(block.timestamp >= timeStart && block.timestamp <= timeClose, "sale not active");
        require(amount > 0, "need amount > 0");
        require(amountTotal < amountRaising, "sold out");
        require(capPerUser == 0 || userInfo[msg.sender].amount + amount <= capPerUser, "over per user cap");

        if (userInfo[msg.sender].amount == 0) {
            addressList.push(msg.sender);
        }
        if (amountTotal + amount > amountRaising) {
            amount = amountRaising - amountTotal;
        }

        _transferFrom(msg.sender, amount);
        userInfo[msg.sender].amount += amount;
        amountTotal = amountTotal + amount;
        emit Deposit(msg.sender, amount);
    }

    function harvest() external nonReentrant {
        (uint contributed, uint claimed, , uint claimable) = getUserInfo(msg.sender);
        uint amount = claimable - claimed;
        require(!paused, "paused");
        require(block.timestamp > timeClose, "sale not ended");
        require(finalized, "not finalized");
        require(contributed > 0, "have you participated?");
        require(amount > 0, "no amount available for claiming");
        userInfo[msg.sender].claimed += amount;
        tokenRaising.safeTransfer(msg.sender, amount);
        emit Harvest(msg.sender, amount);
    }

    function withdrawToken(address token, uint amount) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    function _transferFrom(address from, uint amount) private {
        uint balanceBefore = tokenRaising.balanceOf(address(this));
        tokenRaising.safeTransferFrom(from, address(this), amount);
        uint balanceAfter = tokenRaising.balanceOf(address(this));
        require(balanceAfter - balanceBefore == amount, "_transferFrom: balance change does not match amount");
    }

    function _min(uint a, uint b) private pure returns (uint) {
        return a < b ? a : b;
    }
}
