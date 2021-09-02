const { expect } = require("chai");
const { parseUnits, expectError, deployRegistry } = require("./utilities");

describe("VotersInvestmentDispenser", function() {
  beforeEach(async function() {
    await deployRegistry();
    this.signers = await ethers.getSigners();
    this.signer = this.signers[0];

    this.MockToken = await ethers.getContractFactory("MockToken");
    this.token = await this.MockToken.deploy();
    await this.token.deployed();

    this.Voters = await ethers.getContractFactory("Voters");
    this.voters = await this.Voters.deploy(
      this.signer.address,
      this.token.address,
      this.token.address
    );
    await this.voters.deployed();

    this.DAO = await ethers.getContractFactory("DAO");
    this.dao = await this.DAO.deploy(this.voters.address, 1, 10, 100, 10);
    await this.dao.deployed();

    this.VotersInvestmentDispenser = await ethers.getContractFactory(
      "VotersInvestmentDispenser"
    );
    this.vid = await this.VotersInvestmentDispenser.deploy(
      this.token.address,
      this.dao.address
    );
    await this.vid.deployed();

    await this.token.approve(this.voters.address, parseUnits("500"));
    await this.voters.lock(parseUnits("500"));
    await this.token
      .connect(this.signers[1])
      .approve(this.voters.address, parseUnits("2000"));
    await this.token.transfer(this.signers[1].address, parseUnits("2000"));
    await this.voters.connect(this.signers[1]).lock(parseUnits("2000"));
    await this.voters.snapshot();
    this.snapshotId = await this.voters.currentSnapshotId();
  });

  it("claimable", async function() {
    expect(
      await this.vid.claimable(this.snapshotId, this.signer.address)
    ).to.equal(0);
    await this.token.approve(this.vid.address, parseUnits("1000"));
    await this.vid.deposit(this.snapshotId, parseUnits("1000"));
    expect(
      await this.vid.claimable(this.snapshotId, this.signer.address)
    ).to.equal(parseUnits("200"));
    expect(
      await this.vid.claimable(this.snapshotId, this.signers[1].address)
    ).to.equal(parseUnits("800"));
    expect(await this.vid.claimable(99, this.signer.address)).to.equal(0);
  });

  it("claim", async function() {
    await this.token.approve(this.vid.address, parseUnits("1000"));
    await this.vid.deposit(this.snapshotId, parseUnits("1000"));

    let balanceBefore = await this.token.balanceOf(this.signer.address);
    await this.vid.claim(this.snapshotId);
    let balanceAfter = await this.token.balanceOf(this.signer.address);
    expect(balanceAfter.sub(balanceBefore)).to.equal(parseUnits("200"));
    expect(await this.vid.claimedAmountsTotals(this.snapshotId)).to.equal(
      parseUnits("200")
    );
    expect(
      await this.vid.claimedAmounts(this.snapshotId, this.signer.address)
    ).to.equal(parseUnits("200"));

    await this.token.approve(this.vid.address, parseUnits("200"));
    await this.vid.deposit(this.snapshotId, parseUnits("200"));
    balanceBefore = await this.token.balanceOf(this.signer.address);
    await this.vid.claim(this.snapshotId);
    balanceAfter = await this.token.balanceOf(this.signer.address);
    expect(balanceAfter.sub(balanceBefore)).to.equal(parseUnits("40"));
    expect(await this.vid.claimedAmountsTotals(this.snapshotId)).to.equal(
      parseUnits("240")
    );
    expect(
      await this.vid.claimedAmounts(this.snapshotId, this.signer.address)
    ).to.equal(parseUnits("240"));
  });
});
