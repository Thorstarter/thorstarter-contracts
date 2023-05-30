// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {SaleFcfsSimple} from "../SaleFcfsSimple.sol";

interface Vm {
    function startBroadcast() external;
    function stopBroadcast() external;
}

contract Deploy {
    event log_named_bytes        (string key, bytes val);
    function run() external {
        Vm vm = Vm(0x7109709ECfa91a80626fF3989D68f67F5b1DD12D);
        vm.startBroadcast();
        emit log_named_bytes("constructor", abi.encodePacked(
            0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4, // payment token
            0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4, // offering token
            uint256(1250000e18), // offerring amount
            uint256(75000e6), // raising amount
            uint256(1685458800), // start time
            uint256(1685545200), // end time
            uint256(0.1e18), // vesting initial
            uint256(31104000) // vesting duration
        ));
        new SaleFcfsSimple(
            0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4, // payment token
            0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4, // offering token
            1250000e18, // offerring amount
            75000e6, // raising amount
            1685458800, // start time
            1685545200, // end time
            0.1e18, // vesting initial
            31104000 // vesting duration
        );
        vm.stopBroadcast();
    }
}
