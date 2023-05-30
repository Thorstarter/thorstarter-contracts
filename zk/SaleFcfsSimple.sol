//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function balanceOf(address) external view returns (uint256);
    function transfer(address, uint256) external returns (bool);
    function transferFrom(address, address, uint256) external returns (bool);
}

contract SaleFcfsSimple {
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
    bool public entered;
    address public owner;
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
    ) public {
        tokenRaising = IERC20(_tokenRaising);
        tokenVesting = IERC20(_tokenVesting);
        amountRaising = _amountRaising;
        amountVesting = _amountVesting;
        timeStart = _timeStart;
        timeClose = _timeClose;
        vestingStart = _timeClose;
        vestingInitial = _vestingInitial;
        vestingDuration = _vestingDuration;
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "unauthorized");
        _;
    }

    modifier nonReentrant() {
        require(!entered, "no-reentering");
        entered = true;
        _;
        entered = false;
    }

    function setOwner(address value) external onlyOwner {
        owner = value;
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
        uint progress = min(block.timestamp - min(block.timestamp, vestingStart), vestingDuration);
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

        transferFrom(msg.sender, amount);
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
        safeTransfer(tokenVesting, msg.sender, amount);
        emit Harvest(msg.sender, amount);
    }

    function withdrawToken(address token, uint amount) external onlyOwner {
        safeTransfer(IERC20(token), msg.sender, amount);
    }

    function transferFrom(address from, uint amount) internal {
        uint balanceBefore = tokenRaising.balanceOf(address(this));
        require(tokenRaising.transferFrom(from, address(this), amount), "transferFrom");
        uint balanceAfter = tokenRaising.balanceOf(address(this));
        require(balanceAfter - balanceBefore == amount, "transferFrom: balance change does not match amount");
    }

    function safeTransfer(IERC20 token, address recipient, uint256 amount) internal {
        require(token.transfer(recipient, amount), "safeTransfer");
    }

    function min(uint a, uint b) private pure returns (uint) {
        return a < b ? a : b;
    }
}
