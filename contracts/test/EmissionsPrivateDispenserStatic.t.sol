// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { DSTest } from "./utils/DSTest.sol";
import { TestERC20 } from "./utils/TestERC20.sol";
import { EmissionsPrivateDispenserStatic } from "../EmissionsPrivateDispenserStatic.sol";

contract TSAggregatorGenericTest is DSTest {
    TestERC20 t;
    EmissionsPrivateDispenserStatic d;

    function setUp() public {
        address[] memory investors = new address[](2);
        investors[0] = vm.addr(1);
        investors[1] = vm.addr(2);
        uint256[] memory percentages = new uint256[](2);
        percentages[0] = 4e11;
        percentages[1] = 6e11;
        t = new TestERC20(18);
        d = new EmissionsPrivateDispenserStatic(
            address(t), 50e18, block.timestamp, 1000, investors, percentages);
        t.mint(address(d), 50e18);
    }

    function testClaim() public {
        assertEq(d.claimable(vm.addr(1)), 0);
        assertEq(d.claimable(vm.addr(2)), 0);
        assertEq(d.claimable(vm.addr(3)), 0);

        vm.warp(block.timestamp + 500);

        assertEq(d.claimable(vm.addr(1)), 10e18);
        assertEq(d.claimable(vm.addr(2)), 15e18);
        assertEq(d.claimable(vm.addr(3)), 0);

        vm.startPrank(vm.addr(2));
        uint256 balanceBefore = t.balanceOf(vm.addr(2));
        d.claim();
        uint256 balanceAfter = t.balanceOf(vm.addr(2));
        assertEq(balanceAfter - balanceBefore, 15e18);
        vm.stopPrank();

        vm.warp(block.timestamp + 2000);

        assertEq(d.claimable(vm.addr(1)), 20e18);
        assertEq(d.claimable(vm.addr(2)), 15e18);
        assertEq(d.claimable(vm.addr(3)), 0);

        vm.startPrank(vm.addr(1));
        balanceBefore = t.balanceOf(vm.addr(1));
        d.claim();
        balanceAfter = t.balanceOf(vm.addr(1));
        assertEq(balanceAfter - balanceBefore, 20e18);
        vm.stopPrank();

        vm.startPrank(vm.addr(2));
        balanceBefore = t.balanceOf(vm.addr(2));
        d.claim();
        balanceAfter = t.balanceOf(vm.addr(2));
        assertEq(balanceAfter - balanceBefore, 15e18);
        vm.stopPrank();
    }
}
