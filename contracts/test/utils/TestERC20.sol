// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TestERC20 {
    string public constant name = "TestUSCD";
    string public constant symbol = "tUSDC";
    uint8 public immutable decimals;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Approval(address indexed src, address indexed guy, uint256 amt);
    event Transfer(address indexed src, address indexed dst, uint256 amt);

    constructor(uint8 _decimals) {
        decimals = _decimals;
    }

    function transfer(address dst, uint256 amt) external returns (bool) {
        return transferFrom(msg.sender, dst, amt);
    }

    function transferFrom(address src, address dst, uint256 amt)
        public
        returns (bool)
    {
        require(balanceOf[src] >= amt, "insufficient balance");
        if (
            src != msg.sender && allowance[src][msg.sender] != type(uint256).max
        ) {
            require(allowance[src][msg.sender] >= amt, "insufficient allowance");
            allowance[src][msg.sender] = allowance[src][msg.sender] - amt;
        }
        balanceOf[src] = balanceOf[src] - amt;
        balanceOf[dst] = balanceOf[dst] + amt;
        emit Transfer(src, dst, amt);
        return true;
    }

    function approve(address usr, uint256 amt) external returns (bool) {
        allowance[msg.sender][usr] = amt;
        emit Approval(msg.sender, usr, amt);
        return true;
    }

    function mint(address usr, uint256 amt) public {
        balanceOf[usr] = balanceOf[usr] + amt;
        totalSupply = totalSupply + amt;
        emit Transfer(address(0), usr, amt);
    }

    function burn(address usr, uint256 amt) public {
        require(balanceOf[usr] >= amt, "insufficient-balance");
        balanceOf[usr] = balanceOf[usr] - amt;
        totalSupply = totalSupply - amt;
        emit Transfer(usr, address(0), amt);
    }
}
