//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC677Receiver } from "./interfaces/IERC677Receiver.sol";

contract SaleShare is IERC677Receiver, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct UserInfo {
        uint amount;
        uint score;
        uint claimed;
    }

    IERC20 public paymentToken;
    IERC20 public offeringToken;
    address public serverSigner;
    uint public startTime;
    uint public endTime;
    uint public offeringAmount;
    uint public raisingAmount;
    uint public vestingStart;
    uint public vestingInitial; // 1e12 = 100%
    uint public vestingDuration;
    bool public paused;
    bool public finalized;
    uint public totalUsers;
    uint public totalScore;
    uint public totalAmount;
    mapping(address => UserInfo) public userInfos;

    event SetTokens(address payment, address offering);
    event SetAmounts(uint offering, uint raising);
    event SetVesting(uint start, uint initial, uint duration);
    event SetTimes(uint start, uint end);
    event SetServerSigner(address serverSigner);
    event SetPaused(bool paused);
    event SetFinalized();
    event Deposit(address indexed user, uint amount);
    event Harvest(address indexed user, uint amount);

    constructor(
        address _paymentToken,
        address _offeringToken,
        address _serverSigner,
        uint _startTime,
        uint _endTime,
        uint _offeringAmount,
        uint _raisingAmount,
        uint _vestingStart,
        uint _vestingInitial,
        uint _vestingDuration
    ) Ownable() {
        paymentToken = IERC20(_paymentToken);
        offeringToken = IERC20(_offeringToken);
        serverSigner = _serverSigner;
        startTime = _startTime;
        endTime = _endTime;
        offeringAmount = _offeringAmount;
        raisingAmount = _raisingAmount;
        vestingStart = _vestingStart;
        vestingInitial = _vestingInitial;
        vestingDuration = _vestingDuration;
        require(_offeringAmount > 0, "offering > 0");
        require(_raisingAmount > 0, "raising > 0");
        require(_startTime < _endTime, "start < end");
        require(_startTime < 1e10, "start time not unix");
        require(_endTime < 1e10, "start time not unix");
        require(_vestingInitial <= 1e12/2, "vesting initial < 50%");
        require(_vestingDuration < 365 days, "vesting duration < 1 year");
        emit SetTokens(_paymentToken, _offeringToken);
        emit SetAmounts(_offeringAmount, _raisingAmount);
        emit SetVesting(_vestingStart, _vestingInitial, _vestingDuration);
    }

    function setTokens(address payment, address offering) external onlyOwner {
        paymentToken = IERC20(payment);
        offeringToken = IERC20(offering);
        emit SetTokens(payment, offering);
    }

    function setAmounts(uint offering, uint raising) external onlyOwner {
        offeringAmount = offering;
        raisingAmount = raising;
        emit SetAmounts(offering, raising);
    }

    function setVesting(uint start, uint initial, uint duration) external onlyOwner {
        vestingStart = start;
        vestingInitial = initial;
        vestingDuration = duration;
        emit SetVesting(start, initial, duration);
    }

    function setTimes(uint _startTime, uint _endTime) external onlyOwner {
        startTime = _startTime;
        endTime = _endTime;
        emit SetTimes(_startTime, _endTime);
    }

    function setServerSigner(address _serverSigner) external onlyOwner {
        serverSigner = _serverSigner;
        emit SetServerSigner(_serverSigner);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit SetPaused(_paused);
    }

    function setFinalized() external onlyOwner {
        // TODO also save finalizedBaseAmount
        finalized = true;
        emit SetFinalized();
    }

    function getParams() external view returns (uint, uint, uint, uint, uint, bool, bool) {
        return (startTime, endTime, raisingAmount, offeringAmount, totalAmount, paused, finalized);
    }

    function getUserInfo(address _user) public view returns (uint, uint, uint, uint) {
        UserInfo memory userInfo = userInfos[_user];

        // 1. Fetch all participants from chain (score + deposit amount)
        // 2. 50% of the sale raising (we will use raising amount to calculate the offering amount to give) amount is split between all participants proportional to their "score" (offering * participant score / total score)
        //   For this step we need to calculate each participant's allocation based on score and, for participant that deposited less funds than allocation, take the extra/surplus allocation and add it to the other 50% of tokens to be distributed evenly
        // 3. We want to figure out the flat/single amount to give to every participant but we need to take into account participants that deposited less than might get allocated to them
        //   So starting with a base amount of 0, increase the by 0.001 (or some small enough step), add all participants allocations up (min(deposit amount, amount from step 2 + base amount), while we're still under to total raising amount, increate base amount by one step

        uint capHalf = (userInfo.score * raisingAmount) / totalScore;
        uint cap = capHalf + finalizedBaseAmount; // TODO
        uint used = _min(userInfo.amount, cap);
        uint refund = userInfo.amount - used;
        uint owed = (used * offeringAmount) / totalAmount;

        uint progress = _min(block.timestamp - _min(block.timestamp, vestingStart), vestingDuration);
        uint claimable = (owed * vestingInitial) / 1e12;
        claimable += ((owed - claimable) * progress) / vestingDuration;
        return (userInfo.amount, userInfo.claimed, owed, claimable, refund);
    }

    function _deposit(address user, uint amount, uint score, bytes memory signature) internal nonReentrant {
        UserInfo storage userInfo = userInfos[user];
        require(!paused, "paused");
        require(amount > 0, "need amount > 0");
        require(block.timestamp >= startTime && block.timestamp <= endTime, "sale not active");
        bytes32 hash = ECDSA.toEthSignedMessageHash(keccak256(abi.encodePacked(user, score)));
        address signer = ECDSA.recover(hash, signature);
        require(signer == serverSigner, "invalid signature");


        if (userInfo.amount == 0) {
            totalUsers += 1;
            userInfo.score = score;
            totalScore = totalScore + score;
        }
        userInfo.amount = userInfo.amount + amount;
        totalAmount = totalAmount + amount;
        emit Deposit(user, amount);
    }

    function depositNative(uint score, bytes calldata signature) public payable {
        require(address(paymentToken) == address(0), "paymentToken is not native");
        _deposit(msg.sender, msg.value, score, signature);
    }

    function deposit(uint amount, uint score, bytes calldata signature) public {
        require(address(paymentToken) != address(0), "paymentToken is native");
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        _deposit(msg.sender, amount, score, signature);
    }

    function onTokenTransfer(address user, uint amount, bytes calldata data) external override {
        require(msg.sender == address(paymentToken), "onTokenTransfer: not paymentToken");
        (uint score, bytes memory signature) = abi.decode(data, (uint, bytes));
        _deposit(user, amount, score, signature);
    }

    function harvest() external nonReentrant {
        (uint contributed, uint claimed, , uint claimable) = getUserInfo(msg.sender);

        require(!paused, "paused");
        require(block.timestamp > endTime, "sale not ended");
        require(finalized, "not finalized");
        require(contributed > 0, "have you participated?");

        uint amount = claimable - claimed;
        require(amount > 0, "no amount available for claiming");

        userInfos[msg.sender].claimed += amount;
        offeringToken.safeTransfer(address(msg.sender), amount);
        emit Harvest(msg.sender, amount);
    }

    function withdrawToken(address token, uint amount) external onlyOwner {
        if (token == address(0)) {
            (bool sent,) = msg.sender.call{value: amount}("");
            require(sent, "failed to send");
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }
    }

    function _min(uint a, uint b) private pure returns (uint) {
        return a < b ? a : b;
    }
}
