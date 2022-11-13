// test/Renascence.test.js
const fs = require('fs');
const { execSync } = require("child_process");
const { expect } = require('chai');
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const Renascence = artifacts.require('Renascence');

contract('Renascence', async function (accounts) {

  let addresses;
  let proofs;
  let skipMint;
  if (process.env.SKIP == 'true') {
    skipMint = true;
  } else {
    skipMint = false;
  }

  const nullAddress = '0x0000000000000000000000000000000000000000';

  function getPrice(amt_eth) {
    return web3.utils.toWei(amt_eth.toString())
  }

  async function simulateTime() {
    // simulate 1+ days
    await web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      id: 0,
      params: [100000]
    }, (err, result) => {});

    await web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_mine',
      id: 0
    }, (err, result) => {});
  }

  before(async function () {
    let addressesWhitelist = new Object();
    addressesWhitelist[accounts[1]] = "1";
    addressesWhitelist[accounts[2]] = "3";
    addressesWhitelist[accounts[3]] = "5";
    addressesWhitelist[accounts[4]] = "15";
    addressesWhitelist[accounts[5]] = "20";

    fs.writeFileSync(
      "./output.json",
      JSON.stringify(addressesWhitelist),
      "utf8"
    );

    execSync(
      `go-merkle-distributor --json-file=output.json --output-file=proofs.json`,
      {
        stdio: "inherit",
      }
    );

    proofs = JSON.parse(fs.readFileSync("proofs.json", "utf8"));
    addresses = Object.keys(proofs);
  });

  beforeEach(async function () {
    this.contract = await Renascence.new(
      "0xf57b2c51ded3a29e6891aba85459d600256cf317",
      {from: accounts[0]}
    );
  });

  it('should start with sales paused and RESERVED phase default', async function () {
    await expect(
      await this.contract.mintingIsActive()
    ).to.equal(false);
    await expect(
      (await this.contract.getMintPhase()).toString()
    ).to.equal('0');
  });

  it('should require ownership for key functions', async function () {
    await expectRevert(
      this.contract.withdraw({from: accounts[1]}),
      'Ownable: caller is not the owner',
    );
    await expectRevert(
      this.contract.toggleMinting({from: accounts[1]}),
      'Ownable: caller is not the owner',
    );
    await expectRevert(
      this.contract.setBaseURI("ipfs://mynewhash", {from: accounts[1]}),
      'Ownable: caller is not the owner',
    );
    await expectRevert(
      this.contract.setContractURI("ipfs://myotherhash", {from: accounts[1]}),
      'Ownable: caller is not the owner',
    );
    await expectRevert(
      this.contract.toggleProxyState('0x406218da64787A7995897dF4eC2b8c8B3620568a', {from: accounts[1]}),
      'Ownable: caller is not the owner',
    );
    await expectRevert(
      this.contract.reserveTokens({from: accounts[1]}),
      'Ownable: caller is not the owner',
    );
  });

  it('should allow working toggles', async function () {
    // toggleMinting function toggles mintingIsActive var
    await expect(
      await this.contract.mintingIsActive()
    ).to.equal(false);
    await this.contract.toggleMinting();
    await expect(
      await this.contract.mintingIsActive()
    ).to.equal(true);
    await this.contract.toggleMinting();
    await expect(
      await this.contract.mintingIsActive()
    ).to.equal(false);
    // toggleProxyState function toggles proxyApproved var
    await expect(
      await this.contract.proxyApproved(nullAddress)
    ).to.equal(false);
    await this.contract.toggleProxyState(nullAddress);
    await expect(
      await this.contract.proxyApproved(nullAddress)
    ).to.equal(true);
    await this.contract.toggleProxyState(nullAddress);
    await expect(
      await this.contract.proxyApproved(nullAddress)
    ).to.equal(false);
  });

  it('should allow set funcs', async function () {
    // setBaseURI function will set new metadata URI for NFTs
    const _hash = 'ipfs://mynewhash/';
    await this.contract.setBaseURI(_hash);
    await expect(
      await this.contract.tokenURI(1)
    ).to.equal(_hash + '1');
    await expect(
      await this.contract.tokenURI(2048)
    ).to.equal(_hash + '2048');
  });

  it('should reserve team tokens upon contract deploy and only allow once', async function () {
    await expect(
      (await this.contract.totalSupply()).toString()
    ).to.equal('52');
    await expect(
      await this.contract.reservedTokens()
    ).to.equal(true);
    await this.contract.reserveTokens();
    await expect(
      (await this.contract.totalSupply()).toString()
    ).to.equal('52');
  });

  // mintReserved checks
  it('should require mintingIsActive be true to mint', async function () {
    await expectRevert(
      this.contract.mintReserved(
        proofs[accounts[5]].Index,
        accounts[5],
        proofs[accounts[5]].Amount,
        proofs[accounts[5]].Proof,
        20, {from: accounts[5]}
      ),
      'Minting is not active.'
    );
  });

  // it('should prevent minting from exceeding max supply', async function () {});

  it('should prevent minting more than whitelisted for', async function () {
    await this.contract.toggleMinting();
    await this.contract.setMerkleRoot(proofs.root.Proof[0]);
    await expectRevert(
      this.contract.mintReserved(
        proofs[accounts[5]].Index,
        accounts[5],
        proofs[accounts[5]].Amount,
        proofs[accounts[5]].Proof,
        21, {from: accounts[5]}
      ),
      'Cannot mint more than the amount whitelisted for.'
    );
  });

  it('should require merkle root be set', async function () {
    await this.contract.toggleMinting();
    await expectRevert(
      this.contract.mintReserved(
        proofs[accounts[5]].Index,
        accounts[5],
        proofs[accounts[5]].Amount,
        proofs[accounts[5]].Proof,
        20, {from: accounts[5]}
      ),
      'Merkle root not set by contract owner.'
    );
  });

  it('should require msg.sender to be whitelisted address', async function () {
    await this.contract.toggleMinting();
    await this.contract.setMerkleRoot(proofs.root.Proof[0]);
    await expectRevert(
      this.contract.mintReserved(
        proofs[accounts[5]].Index,
        accounts[5],
        proofs[accounts[5]].Amount,
        proofs[accounts[5]].Proof,
        20, {from: accounts[50]}
      ),
      'Can only be claimed by the whitelisted address.'
    );
  });

  it('should require valid merkle proof signature', async function () {
    await this.contract.toggleMinting();
    await this.contract.setMerkleRoot(proofs.root.Proof[0]);
    await expectRevert(
      this.contract.mintReserved(
        proofs[accounts[5]].Index,
        accounts[5],
        500,
        proofs[accounts[5]].Proof,
        20, {from: accounts[5]}
      ),
      'Invalid merkle proof.'
    );
  });

  it('should allow minting for whitelisted addresses', async function () {
    await this.contract.toggleMinting();
    await this.contract.setMerkleRoot(proofs.root.Proof[0]);
    await this.contract.mintReserved(
      proofs[accounts[1]].Index,
      accounts[1],
      proofs[accounts[1]].Amount,
      proofs[accounts[1]].Proof,
      1, {from: accounts[1]}
    );
    await this.contract.mintReserved(
      proofs[accounts[2]].Index,
      accounts[2],
      proofs[accounts[2]].Amount,
      proofs[accounts[2]].Proof,
      3, {from: accounts[2]}
    );
    await this.contract.mintReserved(
      proofs[accounts[3]].Index,
      accounts[3],
      proofs[accounts[3]].Amount,
      proofs[accounts[3]].Proof,
      5, {from: accounts[3]}
    );
    await this.contract.mintReserved(
      proofs[accounts[4]].Index,
      accounts[4],
      proofs[accounts[4]].Amount,
      proofs[accounts[4]].Proof,
      15, {from: accounts[4]}
    );
    await this.contract.mintReserved(
      proofs[accounts[5]].Index,
      accounts[5],
      proofs[accounts[5]].Amount,
      proofs[accounts[5]].Proof,
      20, {from: accounts[5]}
    );
  });

  // mintPublic

  if('should require mintingIsActive be true to mint', async function() {
    await simulateTime();
    await expectRevert(
      this.contract.mintPublic(
        1, {from: accounts[10]}
      ),
      'Minting is not active.'
    );
  });

  if('should require PUBLIC mint phase for mintPublic', async function() {
    await this.contract.toggleMinting();
    await expectRevert(
      this.contract.mintPublic(
        1, {from: accounts[10]}
      ),
      'Must be in public mint phase.'
    );
  });

  if('should prevent minting more than 3 per tx', async function() {
    await this.contract.toggleMinting();
    await simulateTime();
    await expectRevert(
      this.contract.mintPublic(
        4, {from: accounts[10]}
      ),
      'Cannot mint more than 3 during mint.'
    );
  });

  if('should prevent minting more than 3 per wallet', async function() {
    await this.contract.toggleMinting();
    await simulateTime();
    await this.contract.mintPublic(
      3, {from: accounts[10]}
    );
    await expectRevert(
      this.contract.mintPublic(
        1, {from: accounts[10]}
      ),
      'Cannot mint more than 3 per wallet.'
    );
    // transfer 1 off to ensure they can't skirt this check
    let tokenId = await this.contract.tokenOfOwnerByIndex(accounts[10], 0);
    await this.contract.transferFrom(accounts[10], nullAddress, tokenId, {from: accounts[10]});
    await expectRevert(
      this.contract.mintPublic(
        1, {from: accounts[10]}
      ),
      'Cannot mint more than 3 per wallet.'
    );
  });

  it('minting supply will halt minting', async function() {
    this.timeout(0); // dont timeout for this long test
    // Minting should not be active be default
    await this.contract.toggleMinting();
    await simulateTime();
    await expect(
      (await this.contract.getMintPhase()).toString()
    ).to.equal('1');
    if (!skipMint) {
      // Mint all 3072 (already minted 52 at contract deploy)
      for (i = 0; i < 1006; i++) {
        await this.contract.mintPublic(3, {from: accounts[10 + i]});
      };
      await expect(
        (await this.contract.totalSupply()).toString()
      ).to.equal('3070');
      await this.contract.mintPublic(2, {from: accounts[2]});
      await expect(
        (await this.contract.totalSupply()).toString()
      ).to.equal('3072');
      // Minting should no longer be active
      await expect(
        await this.contract.mintingIsActive()
      ).to.equal(false);
      // Should not be able to mint more
      await expectRevert(
        this.contract.mintPublic(3, {from: accounts[1]}),
        'Minting is not active.',
      );
    }
  });


});
