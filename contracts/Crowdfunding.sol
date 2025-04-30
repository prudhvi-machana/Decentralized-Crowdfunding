// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Crowdfunding is ReentrancyGuard {
    struct Campaign {
        address payable creator;
        string title;
        uint256 goal;
        uint256 deadline;
        uint256 amountRaised;
        bool fundsReleased;
    }

    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(uint256 => address[]) public backers;

    event CampaignCreated(
        uint256 campaignId,
        address creator,
        string title,
        uint256 goal,
        uint256 deadline
    );
    event ContributionMade(
        uint256 campaignId,
        address backer,
        uint256 amount
    );
    event FundsReleased(
        uint256 campaignId,
        address creator,
        uint256 amount
    );
    event RefundIssued(
        uint256 campaignId,
        address backer,
        uint256 amount
    );

    // Create a new campaign
    function createCampaign(
        string memory _title,
        uint256 _goal,
        uint256 _duration
    ) external {
        require(_goal > 0, "Goal must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");

        campaignCount++;
        campaigns[campaignCount] = Campaign(
            payable(msg.sender),
            _title,
            _goal,
            block.timestamp + _duration,
            0,
            false
        );

        emit CampaignCreated(
            campaignCount,
            msg.sender,
            _title,
            _goal,
            block.timestamp + _duration
        );
    }

    // Contribute to a campaign
    function contribute(uint256 _campaignId) external payable {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp < campaign.deadline, "Campaign has ended");
        require(msg.value > 0, "Contribution must be greater than 0");

        if (contributions[_campaignId][msg.sender] == 0) {
            backers[_campaignId].push(msg.sender);
        }
        campaign.amountRaised += msg.value;
        contributions[_campaignId][msg.sender] += msg.value;

        emit ContributionMade(_campaignId, msg.sender, msg.value);
    }

    // Release funds to creator or refund backers
    function releaseOrRefund(uint256 _campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp >= campaign.deadline, "Campaign not ended yet");
        require(!campaign.fundsReleased, "Funds already handled");

        campaign.fundsReleased = true;

        if (campaign.amountRaised >= campaign.goal) {
            campaign.creator.transfer(campaign.amountRaised);
            emit FundsReleased(_campaignId, campaign.creator, campaign.amountRaised);
        } else {
            address[] memory campaignBackers = backers[_campaignId];
            for (uint256 i = 0; i < campaignBackers.length; i++) {
                address backer = campaignBackers[i];
                uint256 amount = contributions[_campaignId][backer];
                if (amount > 0) {
                    contributions[_campaignId][backer] = 0; // Reset after transfer
                    payable(backer).transfer(amount);
                    emit RefundIssued(_campaignId, backer, amount);
                }
            }
        }
    }

    // View functions
    function getCampaignCount() public view returns (uint256) {
        return campaignCount;
    }

    function getCampaign(uint256 _campaignId)
        public
        view
        returns (
            address creator,
            string memory title,
            uint256 goal,
            uint256 deadline,
            uint256 amountRaised,
            bool fundsReleased
        )
    {
        Campaign memory c = campaigns[_campaignId];
        return (c.creator, c.title, c.goal, c.deadline, c.amountRaised, c.fundsReleased);
    }

    function getContribution(uint256 _campaignId, address _backer) public view returns (uint256) {
        return contributions[_campaignId][_backer];
    }

    function getBackers(uint256 _campaignId) public view returns (address[] memory) {
        return backers[_campaignId];
    }
}
