const { expect } = require("chai");
const { upgrades } = require("hardhat");
const {
  ADDRESS_ZERO,
  ADDRESS_DEAD,
  bn,
  deployRegistry,
  expectError,
  advanceTime
} = require("./utilities");

describe("Forge", function() {
  beforeEach(async function() {
    await deployRegistry();
    this.signers = await ethers.getSigners();
    this.signer = this.signers[0];

    this.MockToken = await ethers.getContractFactory("MockToken");
    this.token = await this.MockToken.deploy();
    await this.token.deployed();
    await this.token.transfer(this.signers[1].address, bn(100));

    this.Forge = await ethers.getContractFactory("ForgeV1");
    this.forge = await upgrades.deployProxy(this.Forge, [
      this.signer.address,
      this.token.address,
      15,
      1095,
      600000000,
      10000000
    ]);
  });

  it("stake", async function() {
    await this.token.approve(this.forge.address, bn(11));

    await expectError("invalid lockDays", () => this.forge.stake(bn(1), 14));
    await expectError("invalid lockDays", () => this.forge.stake(bn(1), 1096));

    const balanceBefore = await this.token.balanceOf(this.signer.address);
    await expect(this.forge.stake(bn(10), 60))
      .to.emit(this.forge, "Staked")
      .withArgs(this.signer.address, bn(10), 60, bn("19.863023698630136986"));
    const balanceAfter = await this.token.balanceOf(this.signer.address);

    expect(balanceAfter.sub(balanceBefore)).to.equal(bn(-10));
    expect((await this.forge.getUserInfo(this.signer.address))[1]).to.equal(
      bn("19.863023698630136986")
    );
    expect(await this.forge.totalSupply()).to.equal(
      bn("19.863023698630136986")
    );

    await this.forge.setPaused(true);
    await expectError("paused", () => this.forge.stake(bn(1), 60));

    await expectError("non-transferable", () =>
      this.forge.transfer(this.signer.address, 1)
    );
  });

  it("unstake", async function() {
    await this.token.approve(this.forge.address, bn(11));
    await this.forge.stake(bn(10), 60);
    await advanceTime(61 * 24 * 60 * 60);

    const balanceBefore = await this.token.balanceOf(this.signer.address);
    await this.forge.unstake(0);
    const balanceAfter = await this.token.balanceOf(this.signer.address);
    expect(balanceAfter.sub(balanceBefore)).to.equal(bn(10));

    await expectError("already unstaked", () => this.forge.unstake(0));
    await expectError("invalid index", () => this.forge.unstake(1));
  });

  it("unstakeEarly", async function() {
    await this.token.approve(this.forge.address, bn(11));
    await this.forge.stake(bn(10), 60);
    await advanceTime(30 * 24 * 60 * 60);

    const balanceBefore = await this.token.balanceOf(this.signer.address);
    await this.forge.unstakeEarly(0);
    const balanceAfter = await this.token.balanceOf(this.signer.address);
    expect(balanceAfter.sub(balanceBefore)).to.equal(bn("5"));

    await expectError("already unstaked", () => this.forge.unstakeEarly(0));
    await expectError("invalid index", () => this.forge.unstakeEarly(1));

    await this.forge.stake(bn(1), 15);
    await advanceTime(16 * 24 * 60 * 60);
    await expectError("not early", () => this.forge.unstakeEarly(1));

    await this.forge.setPaused(true);
    await expectError("paused", () => this.forge.unstakeEarly(0));
  });

  it("calculateShares", async function() {
    let amounts = [
      bn(10),
      bn(100),
      bn(1000),
      bn(10000),
      bn(50000),
      bn(250000),
      bn(1000000),
      bn(3000000),
      bn(10000000),
      bn(75000000)
    ];
    for (let n of amounts) {
      const totals = await this.forge.calculateShares(n, "60");
      const bonus = totals[0].sub(totals[1]).sub(n);
      /*
      console.log(
        ethers.utils.formatUnits(n),
        ethers.utils.formatUnits(bonus),
        ethers.utils.formatUnits(totals[0])
      );
      */
    }
  });
});
