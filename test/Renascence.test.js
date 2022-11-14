// test/Renascence.test.js
const { expect } = require('chai');
const { expectRevert } = require('@openzeppelin/test-helpers');
const Renascence = artifacts.require('Renascence');

contract('Renascence', async function (accounts) {

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

  beforeEach(async function () {
    this.contract = await Renascence.new(
      {from: accounts[0]}
    );
  });

  it('should start with sales paused', async function () {
    expect(
      await this.contract.mintingIsActive()
    ).to.equal(false);
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
      this.contract.reserveTokens({from: accounts[1]}),
      'Ownable: caller is not the owner',
    );
  });

  it('should allow working toggles', async function () {
    // toggleMinting function toggles mintingIsActive var
    expect(
      await this.contract.mintingIsActive()
    ).to.equal(false);
    await this.contract.toggleMinting();
    expect(
      await this.contract.mintingIsActive()
    ).to.equal(true);
    await this.contract.toggleMinting();
    expect(
      await this.contract.mintingIsActive()
    ).to.equal(false);
  });

  it('should allow set funcs', async function () {
    // setBaseURI function will set new metadata URI for NFTs
    const _hash = 'ipfs://mynewhash/';
    await this.contract.setBaseURI(_hash);
    expect(
      await this.contract.tokenURI(1)
    ).to.equal(_hash + '1');
    expect(
      await this.contract.tokenURI(2048)
    ).to.equal(_hash + '2048');
  });

  it('should reserve team tokens upon contract deploy and only allow once', async function () {
    expect(
      (await this.contract.totalSupply()).toString()
    ).to.equal('196');
    expect(
      await this.contract.reservedTokens()
    ).to.equal(true);
    await this.contract.reserveTokens();
    expect(
      (await this.contract.totalSupply()).toString()
    ).to.equal('196');
  });

  it('should require mintingIsActive be true to mint', async function() {
    await expectRevert(
      this.contract.mintPublic(
        1, {from: accounts[10]}
      ),
      'Minting is not active.'
    );
  });

  it('should prevent minting more than 4 per tx', async function() {
    await this.contract.toggleMinting();
    await expectRevert(
      this.contract.mintPublic(
        5, {from: accounts[10]}
      ),
      'Cannot mint more than 4 during mint.'
    );
  });

  it('should prevent minting more than 4 per wallet', async function() {
    await this.contract.toggleMinting();
    await this.contract.mintPublic(
      4, {from: accounts[10]}
    );
    await expectRevert(
      this.contract.mintPublic(
        1, {from: accounts[10]}
      ),
      'Cannot mint more than 4 per wallet.'
    );
    // transfer 1 off to ensure they can't skirt this check
    let tokenId = await this.contract.tokenOfOwnerByIndex(accounts[10], 0);
    await this.contract.transferFrom(accounts[10], nullAddress, tokenId, {from: accounts[10]});
    await expectRevert(
      this.contract.mintPublic(
        1, {from: accounts[10]}
      ),
      'Cannot mint more than 4 per wallet.'
    );
  });

  it('minting supply will halt minting', async function() {
    this.timeout(0); // dont timeout for this long test
    // Minting should not be active be default
    await this.contract.toggleMinting();
    if (!skipMint) {
      // Mint all 4096 (already minted 196 at contract deploy)
      for (i = 0; i < 975; i++) {
        await this.contract.mintPublic(4, {from: accounts[10 + i]});
      };
      expect(
        (await this.contract.totalSupply()).toString()
      ).to.equal('4096');
      // Minting should no longer be active
      expect(
        await this.contract.mintingIsActive()
      ).to.equal(false);
      // Should not be able to mint more
      await expectRevert(
        this.contract.mintPublic(1, {from: accounts[1]}),
        'Minting is not active.',
      );
    }
  });

});
