// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {EmissionsPrivateDispenserStatic} from "../EmissionsPrivateDispenserStatic.sol";

interface Vm {
    function startBroadcast() external;
    function stopBroadcast() external;
}

contract Deploy {
    function run() external {
        address[] memory investors = new address[](42);
        uint256[] memory percentages = new uint256[](42);
        investors[0] = 0x34Efe0D4661D52AA79cd2Cc1a7017E8B1309c8C3;
        percentages[0] = 33333333333;
        investors[1] = 0xa8683E7d45cA9E4746b1C7b9Ab4457E6128aF6ab;
        percentages[1] = 200000000000;
        investors[2] = 0x2a645c2794B3791b657126f2108D11E0A863E142;
        percentages[2] = 83333333333;
        investors[3] = 0x35B56618Aad07Af51A3Fb4b80cAFEC6B1175B886;
        percentages[3] = 83333333333;
        investors[4] = 0x43436C54D4d1b5c3bef23b58176b922bCB73fb9A;
        percentages[4] = 13333333333;
        investors[5] = 0x91f9FDf8e27755aC0bb728aD501742abf57e922D;
        percentages[5] = 33333333333;
        investors[6] = 0x07FFFed18d42472d009AD1B3DBb2e894F19EBc56;
        percentages[6] = 26666666666;
        investors[7] = 0x10a63354fEf491942fDCbDB2c1Ad042881A14B26;
        percentages[7] = 50000000000;
        investors[8] = 0x3b1E215FE1138aA9034b5E6De39892e45ac05176;
        percentages[8] = 30666666666;
        investors[9] = 0x471903799A45c6da3eC2a3a6fFAbA20AAeC9e973;
        percentages[9] = 30666666666;
        investors[10] = 0xa4E5D572Ba7b92bF8F8a06574770aFb60c603E00;
        percentages[10] = 22000000000;
        investors[11] = 0x40A392A72F08520c43d12774cb46e3BFcE814E4b;
        percentages[11] = 16666666666;
        investors[12] = 0xA2dCB52F5cF34a84A2eBFb7D937f7051ae4C697B;
        percentages[12] = 16666666666;
        investors[13] = 0x04Ddf96a61C4C44731f04Df4E963F61CFE3c9c6d;
        percentages[13] = 4000000000;
        investors[14] = 0x3cA2BF960C4A0F8217988Dc6EA415aEA09C883ad;
        percentages[14] = 8333333333;
        investors[15] = 0xC523433AC1Cc396fA58698739b3B0531Fe6C4268;
        percentages[15] = 20000000000;
        investors[16] = 0xB3C7C41dC82DC19391424B2EEf6F301D20Ca18CC;
        percentages[16] = 6666666666;
        investors[17] = 0xf01D14cC69B7217FB4CAC7e28Be81D945E28Fb4a;
        percentages[17] = 25666666666;
        investors[18] = 0x6e4116462a0abE7A5e75dD66e44A1cBB6b2006F1;
        percentages[18] = 1000000000;
        investors[19] = 0x367d36478F19395F920CF84FA46aa94d365f5253;
        percentages[19] = 1333333333;
        investors[20] = 0x52E7bdE89Fcbd1e1C656Db1C08DdE45D82447e25;
        percentages[20] = 2666666666;
        investors[21] = 0xeb1eF2FB8bFF1Da1CE36babAFA28ee2d1C526b66;
        percentages[21] = 1666666666;
        investors[22] = 0xF76dbc5d9A7465EcEc49700054bF27f88cf9ad05;
        percentages[22] = 1666666666;
        investors[23] = 0xbCd4cB80Ba69376E10082427D6b50a181abCd307;
        percentages[23] = 1333333333;
        investors[24] = 0x145fFa5A63efb3077e48058B90Ac5875B2383042;
        percentages[24] = 3333333333;
        investors[25] = 0xc84096ee48090Fef832D0A77082385ea0EA2993D;
        percentages[25] = 4000000000;
        investors[26] = 0x6AE009d55F095099D6a789278ee7c001e7D0e51e;
        percentages[26] = 5000000000;
        investors[27] = 0x52611C224e44867Ca611cFA0D05535d7ba07dC55;
        percentages[27] = 2666666666;
        investors[28] = 0x9D61B621Ed6cA279EB7f3f2106352117fE9DaDD2;
        percentages[28] = 10000000000;
        investors[29] = 0x3Bc162cEe9ef4e01Dfc641f5Ea77Ab7B06e5B501;
        percentages[29] = 23333333333;
        investors[30] = 0x78Bf8b271510E949ae4479bEd90c0c9a17cf020b;
        percentages[30] = 23333333333;
        investors[31] = 0xf1a785d140b102234315b1f837C5C15853eE8386;
        percentages[31] = 20000000000;
        investors[32] = 0xe139aB520c71C6dD7dF0af0015c2773002742C0c;
        percentages[32] = 13333333333;
        investors[33] = 0x605404298eCa4Eb22ac38A781C7299194be91eac;
        percentages[33] = 23333333333;
        investors[34] = 0xCb1F39532dd59a903d31500E74A879d9dC283b6F;
        percentages[34] = 3333333333;
        investors[35] = 0x3489DBBf6d7ebEdeB503C71ae066CF5DfA54b8a9;
        percentages[35] = 6666666666;
        investors[36] = 0xD09545A4446f5E2F4749a49c7C32B3Ce42a5Fe37;
        percentages[36] = 5000000000;
        investors[37] = 0xDD3ebE16b9E5155dA25F86f301D4D97bd87a8A56;
        percentages[37] = 5000000000;
        investors[38] = 0x2fd6fdB35Afc8B42f744146eC6b114891cE490c3;
        percentages[38] = 666666666;
        investors[39] = 0x482c7F6217292d40452b68897c8265d49f20A511;
        percentages[39] = 3333333333;
        investors[40] = 0x997fb1A5a5c9983A2ffEB9453E719975A2583Dc8;
        percentages[40] = 133333333333;
        investors[41] = 0x000000000000000000000000000000000000dEaD;
        percentages[41] = 14;
        Vm vm = Vm(0x7109709ECfa91a80626fF3989D68f67F5b1DD12D);
        vm.startBroadcast();
        new EmissionsPrivateDispenserStatic(
            0x69fa0feE221AD11012BAb0FdB45d444D3D2Ce71c, // XRUNE token
            30000000e18, // total
            1630418400 + 31536000, // start (original start + 1y)
            31536000, // duration (1y)
            investors,
            percentages
        );
        vm.stopBroadcast();
    }
}
