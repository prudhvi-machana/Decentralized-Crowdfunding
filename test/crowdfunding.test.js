const Crowdfunding = artifacts.require("Crowdfunding");
const MaliciousBacker = artifacts.require("MaliciousBacker");

contract("Crowdfunding", (accounts) => {
  let crowdfunding;
  const [creator, backer, thirdParty] = accounts;
  const goal = web3.utils.toWei("5", "ether");
  const contribution = web3.utils.toWei("1", "ether");

  beforeEach(async () => {
    crowdfunding = await Crowdfunding.new();
  });

  it("should create a campaign", async () => {
    const tx = await crowdfunding.createCampaign("Test Campaign", goal, 3600, { from: creator });
    assert.equal(tx.logs[0].event, "CampaignCreated", "Should emit CampaignCreated event");
    const campaign = await crowdfunding.campaigns(1);
    assert.equal(campaign.title, "Test Campaign", "Campaign title mismatch");
  });

  it("should accept contributions and track them", async () => {
    await crowdfunding.createCampaign("Test Campaign", goal, 3600, { from: creator });
    const tx = await crowdfunding.contribute(1, { from: backer, value: contribution });
    assert.equal(tx.logs[0].event, "ContributionMade", "Should emit ContributionMade event");
    const recorded = await crowdfunding.getContribution(1, backer);
    assert.equal(recorded.toString(), contribution, "Contribution not tracked correctly");
  });

  it("should reject zero contributions", async () => {
    await crowdfunding.createCampaign("Zero Test", goal, 3600, { from: creator });
    try {
      await crowdfunding.contribute(1, { from: backer, value: 0 });
      assert.fail("Should reject zero value");
    } catch (error) {
      assert(error.message.includes("Contribution must be greater than 0"), "Missing zero-value check");
    }
  });

  it("should handle multiple contributors", async () => {
    await crowdfunding.createCampaign("Multi-contributor", goal, 3600, { from: creator });
    await crowdfunding.contribute(1, { from: backer, value: contribution });
    await crowdfunding.contribute(1, { from: thirdParty, value: contribution });
    const campaign = await crowdfunding.campaigns(1);
    const expectedTotal = web3.utils.toBN(contribution).mul(web3.utils.toBN(2));
    assert.equal(campaign.amountRaised.toString(), expectedTotal.toString(), "Failed to accumulate contributions");
  });

  it("should not accept contributions after deadline", async () => {
    await crowdfunding.createCampaign("Expired Test", goal, 1, { from: creator });
    await time.increase(2);
    try {
      await crowdfunding.contribute(1, { from: backer, value: contribution });
      assert.fail("Contribution after deadline should fail");
    } catch (error) {
      assert(error.message.includes("Campaign has ended"), "Expected campaign ended error");
    }
  });

  it("should release funds to creator if goal is met", async () => {
    await crowdfunding.createCampaign("Goal Met", contribution, 1, { from: creator });
    await crowdfunding.contribute(1, { from: backer, value: contribution });
    await time.increase(2);

    const initialBalance = web3.utils.toBN(await web3.eth.getBalance(creator));
    // Call releaseOrRefund from backer to avoid gas deduction from creator
    const tx = await crowdfunding.releaseOrRefund(1, { from: backer });
    const finalBalance = web3.utils.toBN(await web3.eth.getBalance(creator));

    assert.equal(tx.logs[0].event, "FundsReleased", "Should emit FundsReleased event");
    assert(finalBalance.sub(initialBalance).eq(web3.utils.toBN(contribution)), "Creator did not receive funds");
  });

  it("should refund contributors if goal is not met", async () => {
    await crowdfunding.createCampaign("Goal Not Met", goal, 1, { from: creator });
    await crowdfunding.contribute(1, { from: backer, value: contribution });
    await time.increase(2);
    const initialBalance = web3.utils.toBN(await web3.eth.getBalance(backer));
    const tx = await crowdfunding.releaseOrRefund(1, { from: backer });
    const gasCost = web3.utils.toBN(tx.receipt.gasUsed).mul(web3.utils.toBN(await web3.eth.getGasPrice()));
    const finalBalance = web3.utils.toBN(await web3.eth.getBalance(backer));
    assert.equal(tx.logs[0].event, "RefundIssued", "Should emit RefundIssued event");
    assert(finalBalance.add(gasCost).gte(initialBalance), "Backer was not refunded properly");
  });

  it("should prevent premature fund release", async () => {
    await crowdfunding.createCampaign("Premature Test", goal, 3600, { from: creator });
    try {
      await crowdfunding.releaseOrRefund(1);
      assert.fail("Should prevent premature execution");
    } catch (error) {
      assert(error.message.includes("Campaign not ended yet"), "Missing deadline check");
    }
  });

  it("should prevent reentrancy attacks", async () => {
    const attacker = await MaliciousBacker.new(crowdfunding.address);
    await crowdfunding.createCampaign("Reentrancy Test", contribution, 3600, { from: creator });
    try {
      await attacker.attack(1, { value: contribution });
      assert.fail("Should prevent reentrancy");
    } catch (error) {
      assert(error.message.includes("revert"), "Reentrancy protection failed");
    }
  });

  // Helper for time manipulation (with callback for compatibility)
  const time = {
    increase: async (seconds) => {
      await new Promise((resolve, reject) => {
        web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_increaseTime",
          params: [seconds],
          id: new Date().getTime()
        }, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      await new Promise((resolve, reject) => {
        web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_mine",
          params: [],
          id: new Date().getTime() + 1
        }, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }
  };
});
