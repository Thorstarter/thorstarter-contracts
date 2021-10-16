const { expect } = require("chai");
const {
  ADDRESS_ZERO,
  deployRegistry,
  currentTime,
  advanceToTime,
  expectError,
  bn
} = require("./utilities");

describe("SaleFcfs", function() {
  beforeEach(async function() {
    await deployRegistry();
    this.signers = await ethers.getSigners();
    this.signer = this.signers[0];
    this.Sale = await ethers.getContractFactory("SaleFcfs");
    this.MockToken = await ethers.getContractFactory("MockToken");

    this.paymentToken = await this.MockToken.deploy();
    await this.paymentToken.deployed();
    this.paymentToken.transfer(this.signers[1].address, bn("10000"));

    this.offeringToken = await this.MockToken.deploy();
    await this.offeringToken.deployed();

    this.Voters = await ethers.getContractFactory("Voters");
    this.voters = await this.Voters.deploy(
      this.signer.address,
      this.paymentToken.address,
      this.paymentToken.address
    );
    await this.voters.deployed();

    this.Tiers = await ethers.getContractFactory("Tiers");
    this.tiers = await this.Tiers.deploy(
      this.signer.address,
      this.paymentToken.address,
      this.voters.address
    );
    await this.tiers.deployed();
    await this.tiers.updateNft(this.paymentToken.address, bn("250"));

    this.deploySale = async function(perUserCap = "100") {
      this.start = (await currentTime()).toNumber();
      this.sale = await this.Sale.deploy(
        this.paymentToken.address,
        this.offeringToken.address,
        this.start + 1000,
        this.start + 20000,
        bn("1000"),
        bn("100"),
        bn(perUserCap),
        ADDRESS_ZERO
      );
      await this.sale.deployed();
      await this.sale.configureTiers(
        this.tiers.address,
        bn("25"),
        [bn("250"), bn("500")],
        [bn("1", 8), bn("2", 8)]
      );
      await this.offeringToken.transfer(this.sale.address, bn("1000"));
    };
    await this.deploySale();
  });

  it("setRaisingAmount", async function() {
    expect(await this.sale.raisingAmount()).to.equal(bn("100"));
    await this.sale.setRaisingAmount(bn("101"));
    expect(await this.sale.raisingAmount()).to.equal(bn("101"));
  });

  it("deposit", async function() {
    await this.paymentToken.approve(this.sale.address, bn("1000"));

    await expectError("not active", async () => {
      await this.sale.deposit(bn("1"));
    });

    await advanceToTime(this.start + 16000);

    await this.sale.deposit(bn("3"));
    expect((await this.sale.userInfo(this.signer.address))[0]).to.equal(
      bn("3")
    );
    expect(await this.sale.totalAmount()).to.equal(bn("3"));
    await this.paymentToken.transferAndCall(this.sale.address, bn("97"), "0x");
    expect((await this.sale.userInfo(this.signer.address))[0]).to.equal(
      bn("100")
    );
    expect(await this.sale.totalAmount()).to.equal(bn("100"));

    await expectError("sold out", async () => {
      await this.paymentToken
        .connect(this.signers[1])
        .transferAndCall(this.sale.address, bn("1"), "0x");
    });

    await expectError("over per user cap", async () => {
      await this.sale.deposit(bn("101"));
    });

    await this.sale.togglePaused();
    await expectError("paused", async () => {
      await this.sale.deposit(bn("1"));
    });
  });

  it("deposit (tiers)", async function() {
    await advanceToTime(this.start + 1001);

    await expectError("over allocation size", async () => {
      await this.paymentToken.transferAndCall(
        this.sale.address,
        bn("100"),
        "0x"
      );
    });

    await this.paymentToken.transferAndCall(this.sale.address, bn("25"), "0x");
    expect((await this.sale.userInfo(this.signer.address))[0]).to.equal(
      bn("25")
    );

    await expectError("over allocation size", async () => {
      await this.paymentToken.transferAndCall(this.sale.address, bn("1"), "0x");
    });
  });

  it("harvestTokens", async function() {
    await this.deploySale("101");

    await expectError("sale not ended", async () => {
      await this.sale.harvest(false);
    });

    await advanceToTime(this.start + 16000);

    let balanceBefore = await this.paymentToken.balanceOf(this.signer.address);
    await this.paymentToken.transferAndCall(this.sale.address, bn("101"), "0x");
    let balanceAfter = await this.paymentToken.balanceOf(this.signer.address);
    expect(balanceAfter.sub(balanceBefore)).to.equal(bn("-100"));

    await advanceToTime(this.start + 20001);

    await expectError("not finalized", async () => {
      await this.sale.harvest(false);
    });

    balanceBefore = await this.offeringToken.balanceOf(this.signer.address);
    await this.sale.finalize();
    await this.sale.harvest(false);
    balanceAfter = await this.offeringToken.balanceOf(this.signer.address);
    expect(balanceAfter.sub(balanceBefore)).to.equal(bn("1000"));

    await expectError("nothing to harvest", async () => {
      await this.sale.harvest(false);
    });

    await this.deploySale();
    await advanceToTime(this.start + 20001);
    await this.sale.finalize();
    await expectError("have you participated?", async () => {
      await this.sale.harvest(false);
    });
  });

  it("withdrawToken", async function() {
    await this.paymentToken.transfer(this.sale.address, bn("2"));
    const balanceBefore = await this.paymentToken.balanceOf(
      this.signer.address
    );
    await this.sale.withdrawToken(this.paymentToken.address, bn("1"));
    const balanceAfter = await this.paymentToken.balanceOf(this.signer.address);
    expect(balanceAfter.sub(balanceBefore)).to.equal(bn("1"));
  });
});
