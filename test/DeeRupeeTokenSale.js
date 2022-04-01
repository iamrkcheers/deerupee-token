var DeeRupeeToken = artifacts.require("./DeeRupeeToken.sol");
var DeeRupeeTokenSale = artifacts.require("./DeeRupeeTokenSale.sol");

contract("DeeRupeeTokenSale", (accounts) => {
  var deployedToken;
  var deployedTokenSaleInstance;
  var admin = accounts[0];
  var buyer = accounts[1];
  var tokenPrice = 1000000000000000; // in wei
  var tokensAvailable = 750000;
  var numberOfTokens;

  it("initializes the contract with the correct values", () =>
    DeeRupeeTokenSale.deployed()
      .then((instance) => {
        deployedTokenSaleInstance = instance;
        return deployedTokenSaleInstance.address;
      })
      .then((address) => {
        assert.notEqual(address, 0x0, "has contract address");
        return deployedTokenSaleInstance.tokenContract();
      })
      .then((address) => {
        assert.notEqual(address, 0x0, "has token contract address");
        return deployedTokenSaleInstance.tokenPrice();
      })
      .then((price) => {
        assert.equal(price, tokenPrice, "token price is correct");
      }));

  it("facilitates token buying", () =>
    DeeRupeeToken.deployed()
      .then((instance) => {
        deployedToken = instance;
        return DeeRupeeTokenSale.deployed();
      })
      .then((instance) => {
        deployedTokenSaleInstance = instance;
        // Provision 75% of all tokens to the token sale
        return deployedToken.transfer(
          deployedTokenSaleInstance.address,
          tokensAvailable,
          { from: admin }
        );
      })
      .then((receipt) => {
        // deployedToken
        //   .balanceOf(deployedTokenSaleInstance.address)
        //   .then((val) => console.log(val));
        numberOfTokens = 10;
        return deployedTokenSaleInstance.buyTokens(numberOfTokens, {
          from: buyer,
          value: numberOfTokens * tokenPrice,
        });
      })
      .then((receipt) => {
        assert.equal(receipt.logs.length, 1, "triggers one event");
        assert.equal(
          receipt.logs[0].event,
          "Sell",
          'should be the "Sell" event'
        );
        assert.equal(
          receipt.logs[0].args._buyer,
          buyer,
          "logs the account that purchased the tokens"
        );
        assert.equal(
          receipt.logs[0].args._amount,
          numberOfTokens,
          "logs the number of tokens purchased"
        );
        return deployedTokenSaleInstance.tokensSold();
      })
      .then((amount) => {
        assert.equal(
          amount.toNumber(),
          numberOfTokens,
          "increments the number of tokens sold"
        );
        return deployedToken.balanceOf(buyer);
      })
      .then((balance) => {
        assert.equal(balance.toNumber(), numberOfTokens);
        return deployedToken.balanceOf(deployedTokenSaleInstance.address);
      })
      .then((balance) => {
        assert.equal(balance.toNumber(), tokensAvailable - numberOfTokens);
        //   Try to buy tokens different from the ether value
        return deployedTokenSaleInstance.buyTokens(numberOfTokens, {
          from: buyer,
          value: 1,
        });
      })
      .then(assert.fail)
      .catch((error) => {
        assert(
          error.message.indexOf("revert") >= 0,
          "msg.value must equal number of tokens in wei"
        );
        return deployedTokenSaleInstance.buyTokens(800000, {
          from: buyer,
          value: numberOfTokens * tokenPrice,
        });
      })
      .then(assert.fail)
      .catch((error) => {
        assert(
          error.message.indexOf("revert") >= 0,
          "cannot purchase more tokens than available"
        );
      }));

  // deployedTokenSaleInstance.tokenContract.transfer()
  // payable in other projects

  it("ends token sale", () =>
    DeeRupeeToken.deployed()
      .then((instance) => {
        // Grab token instance first
        deployedToken = instance;
        return DeeRupeeTokenSale.deployed();
      })
      .then((instance) => {
        // Then grab token sale instance
        tokenSaleInstance = instance;
        // Try to end sale from account other than the admin
        return deployedTokenSaleInstance.endSale({ from: buyer });
      })
      .then(assert.fail)
      .catch((error) => {
        assert(
          error.message.indexOf("revert" >= 0, "must be admin to end sale")
        );
        // End sale as admin
        return deployedTokenSaleInstance.endSale({ from: admin });
      })
      .then((receipt) => {
        return deployedToken.balanceOf(admin);
      })
      .then((balance) => {
        assert.equal(
          balance.toNumber(),
          999990,
          "returns all unsold dapp tokens to admin"
        );
        // Check that the contract has no balance
        return web3.eth.getBalance(deployedTokenSaleInstance.address);
        // return deployedTokenSaleInstance.tokenPrice();
      })
      .then((balance) => {
        assert.equal(balance, 0);
        // assert.equal(price.toNumber(), 0);
      }));
});
