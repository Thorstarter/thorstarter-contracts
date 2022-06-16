const { expect } = require("chai");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const {
  deployRegistry,
  currentTime,
  advanceToTime,
  expectError,
  bn,
  ADDRESS_ZERO
} = require("./utilities");

describe("SaleShare", function() {
  beforeEach(async function() {
    await deployRegistry();
    this.signers = await ethers.getSigners();
    this.signer = this.signers[0];
    this.Sale = await ethers.getContractFactory("SaleShare");
    this.MockToken = await ethers.getContractFactory("MockToken");

    this.paymentToken = await this.MockToken.deploy();
    await this.paymentToken.deployed();
    this.offeringToken = await this.MockToken.deploy();
    await this.offeringToken.deployed();

    this.start = (await currentTime()).toNumber();
    this.sale = await this.Sale.deploy(
      this.paymentToken.address,
      this.offeringToken.address,
      this.signers[3].address,
      this.start + 1000,
      this.start + 5000,
      bn("500"),
      bn("100"),
      this.start + 10000,
      bn("1", 12).div(10), // 10%
      bn("300", 0) // 5 minutes
    );
    await this.sale.deployed();
    await this.offeringToken.transfer(this.sale.address, bn("2000"));
    await this.paymentToken.approve(this.sale.address, bn("100"));
    await this.paymentToken.transfer(this.signers[1].address, bn("100"));
    await this.paymentToken
      .connect(this.signers[1])
      .approve(this.sale.address, bn("100"));
  });

  function signDeposit(serverSigner, user, score) {
    return serverSigner.signMessage(
      ethers.utils.arrayify(
        ethers.utils.solidityKeccak256(
          ["address", "uint"],
          [user.address, score]
        )
      )
    );
  }

  it("setAmounts", async function() {
    await this.sale.setAmounts(bn("2"), bn("1"));
    expect(await this.sale.raisingAmount()).to.equal(bn("1"));
    expect(await this.sale.offeringAmount()).to.equal(bn("2"));
  });

  it("setVesting", async function() {
    await this.sale.setVesting(this.start + 11000, bn("4", 10), bn("3"));
    expect(await this.sale.vestingStart()).to.equal(this.start + 11000);
    expect(await this.sale.vestingInitial()).to.equal(bn("4", 10));
    expect(await this.sale.vestingDuration()).to.equal(bn("3"));
  });

  it("setPaused", async function() {
    expect(await this.sale.paused()).to.equal(false);
    await this.sale.setPaused(true);
    expect(await this.sale.paused()).to.equal(true);
  });

  it("deposit", async function() {
    const score = bn("23000", 0);
    const signature = await signDeposit(this.signers[3], this.signer, score);
    await expectError("not active", async () => {
      await this.sale.deposit(bn("50"), score, signature);
    });

    await advanceToTime(this.start + 1001);
    await this.sale.deposit(bn("50"), score, signature);

    let userInfo = await this.sale.getUserInfo(this.signer.address);
    expect(userInfo[0]).to.equal(bn("50"));
    expect(userInfo[2]).to.equal(bn("250"));
    expect(await this.sale.totalUsers()).to.equal(1);
    expect(await this.sale.totalScore()).to.equal(score);
    expect(await this.sale.totalAmount()).to.equal(bn("50"));

    await this.sale.deposit(bn("1"), score, signature);
    userInfo = await this.sale.getUserInfo(this.signer.address);
    expect(userInfo[0]).to.equal(bn("51"));
    expect(userInfo[2]).to.equal(bn("255"));
    expect(await this.sale.totalUsers()).to.equal(1);
    expect(await this.sale.totalScore()).to.equal(score);
    expect(await this.sale.totalAmount()).to.equal(bn("51"));

    await expectError("need amount > 0", async () => {
      await this.sale.deposit(bn("0"), score, signature);
    });
    await expectError("invalid signature", async () => {
      await this.sale.deposit(bn("1"), bn("1"), signature);
    });
    await expectError("invalid signature", async () => {
      await this.sale
        .connect(this.signers[1])
        .deposit(bn("1"), score, signature);
    });
    const signature2 = await signDeposit(
      this.signers[3],
      this.signers[1],
      score
    );
    await this.sale
      .connect(this.signers[1])
      .deposit(bn("9"), score, signature2);

    await this.sale.setPaused(true);
    await expectError("paused", async () => {
      await this.sale.deposit(bn("1"), score, signature);
    });
  });

  it("harvest", async function() {
    await expectError("sale not ended", async () => {
      await this.sale.harvest();
    });

    await advanceToTime(this.start + 1001);
    let balanceBefore = await this.paymentToken.balanceOf(
      this.signers[0].address
    );
    const score = bn("23000", 0);
    const signature = await signDeposit(this.signers[3], this.signer, score);
    await this.sale.deposit(bn("90"), score, signature);
    let balanceAfter = await this.paymentToken.balanceOf(
      this.signers[0].address
    );
    expect(balanceBefore.sub(balanceAfter).gte(bn("90"))).to.equal(true);
    await advanceToTime(this.start + 5001);

    await expectError("not finalized", async () => {
      await this.sale.harvest();
    });

    balanceBefore = await this.offeringToken.balanceOf(this.signer.address);
    await this.sale.setFinalized();
    await this.sale.harvest();
    balanceAfter = await this.offeringToken.balanceOf(this.signer.address);
    expect(balanceAfter.sub(balanceBefore)).to.equal(bn("45"));

    let userInfo = await this.sale.getUserInfo(this.signer.address);
    expect(userInfo[3]).to.equal(bn("45"));
    expect(userInfo[3].sub(userInfo[1])).to.equal(bn("0"));

    await advanceToTime(this.start + 10001 + 300);
    //await this.signer.sendTransaction({ to: this.signer.address, value: bn("1") });
    userInfo = await this.sale.getUserInfo(this.signer.address);
    expect(userInfo[3]).to.equal(bn("450"));

    balanceBefore = await this.offeringToken.balanceOf(this.signer.address);
    await this.sale.harvest();
    balanceAfter = await this.offeringToken.balanceOf(this.signer.address);
    expect(balanceAfter.sub(balanceBefore)).to.equal(bn("405"));
    userInfo = await this.sale.getUserInfo(this.signer.address);
    expect(userInfo[0]).to.equal(bn("90"));
    expect(userInfo[1]).to.equal(bn("450"));
    expect(userInfo[2]).to.equal(bn("450"));
    expect(userInfo[3]).to.equal(bn("450"));

    await expectError("no amount available for claiming", async () => {
      await this.sale.harvest();
    });
    await expectError("have you participated?", async () => {
      await this.sale.connect(this.signers[1]).harvest();
    });
  });

  it("withdrawToken", async function() {
    // ETH
    // await advanceToTime(this.start + 1001);
    // await this.sale.deposit(bn("90"), this.proofs[0], { value: bn("90") });
    // let balanceBefore = await this.signer.getBalance();
    // await this.sale.withdrawToken(ADDRESS_ZERO, bn("2.5"));
    // let balanceAfter = await this.signer.getBalance();
    // expect(balanceAfter.sub(balanceBefore).gt(bn("2.49"))).to.equal(true);

    // Token
    await this.offeringToken.transfer(this.sale.address, bn("2"));
    balanceBefore = await this.offeringToken.balanceOf(this.signer.address);
    await this.sale.withdrawToken(this.offeringToken.address, bn("1.23"));
    balanceAfter = await this.offeringToken.balanceOf(this.signer.address);
    expect(balanceAfter.sub(balanceBefore)).to.equal(bn("1.23"));
  });
});
