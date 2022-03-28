const DeeRupeeToken = artifacts.require("./DeeRupeeToken.sol");

contract("DeeRupeeToken", (accounts) => {
  var deployedToken;

  it("initializes the contract with the correct values", () =>
    DeeRupeeToken.deployed()
      .then((_deployedToken) => {
        deployedToken = _deployedToken;
        return deployedToken.name();
      })
      .then((name) => {
        assert.equal(name, "DeeRupee Token", "has the correct name");
        return deployedToken.symbol();
      })
      .then((symbol) => {
        assert.equal(symbol, "DRP", "has the correct symbol");
        return deployedToken.standard();
      })
      .then((standard) => {
        assert.equal(
          standard,
          "DeeRupee Token v1.0",
          "has the correct standard"
        );
        return deployedToken.standard();
      }));

  it("allocates the initial supply upon deployment", () =>
    DeeRupeeToken.deployed()
      .then((_deployedToken) => {
        deployedToken = _deployedToken;
        return deployedToken.totalSupply();
      })
      .then((totalSupply) => {
        assert.equal(
          totalSupply.toNumber(),
          1000000,
          "sets the total supply upon deployment"
        );
        return deployedToken.balanceOf(accounts[0]);
      })
      .then((adminBalance) =>
        assert.equal(
          adminBalance.toNumber(),
          1000000,
          "it allocates the initial supply to the admin account"
        )
      ));

  it("transfers token ownership", () =>
    DeeRupeeToken.deployed()
      .then((_deployedToken) => {
        deployedToken = _deployedToken;
        return deployedToken.transfer.call(accounts[9], 1000001);
      })
      .then(assert.fail)
      .catch((error) => {
        assert(
          error.message.indexOf("revert") >= 0,
          "error message must contain revert"
        );
        return deployedToken.transfer.call(accounts[1], 250000, {
          from: accounts[0],
        });
      })
      .then((success) => {
        assert.equal(success, true, "it returns true");
        return deployedToken.transfer(accounts[1], 250000, {
          from: accounts[0],
        });
      })
      .then((receipt) => {
        assert.equal(receipt.logs.length, 1, "triggers one event");
        assert.equal(
          receipt.logs[0].event,
          "Transfer",
          "should be the 'Transfer' event"
        );
        assert.equal(
          receipt.logs[0].args._from,
          accounts[0],
          "logs the account the tokens are transferred from"
        );
        assert.equal(
          receipt.logs[0].args._to,
          accounts[1],
          "logs the account the tokens are transferred to"
        );
        assert.equal(
          receipt.logs[0].args._value,
          250000,
          "logs the transfer amount"
        );
        return deployedToken.balanceOf(accounts[1]);
      })
      .then((balance) => {
        assert.equal(
          balance.toNumber(),
          250000,
          "adds the amount to the receiving amount"
        );
        return deployedToken.balanceOf(accounts[0]);
      })
      .then((balance) =>
        assert.equal(
          balance.toNumber(),
          750000,
          "deducts the amount from the sending amount"
        )
      ));

  it("approves tokens for delegated transfer", () =>
    DeeRupeeToken.deployed()
      .then((_deployedToken) => {
        deployedToken = _deployedToken;
        return deployedToken.approve.call(accounts[1], 100);
      })
      .then((success) => {
        assert.equal(success, true, "it returns true");
        return deployedToken.approve(accounts[1], 100, { from: accounts[0] });
      })
      .then((receipt) => {
        assert.equal(receipt.logs.length, 1, "triggers one event");
        assert.equal(
          receipt.logs[0].event,
          "Approval",
          "should be the 'Approval' event"
        );
        assert.equal(
          receipt.logs[0].args._owner,
          accounts[0],
          "logs the account the tokens are authorised by"
        );
        assert.equal(
          receipt.logs[0].args._spender,
          accounts[1],
          "logs the account the tokens are authorised to"
        );
        assert.equal(
          receipt.logs[0].args._value,
          100,
          "logs the transfer amount"
        );
        return deployedToken.allowance(accounts[0], accounts[1]);
      })
      .then((allowance) => {
        assert.equal(
          allowance.toNumber(),
          100,
          "stores the allowance for delegated transfer"
        );
      }));

  it("handles delegated token transfers", () =>
    DeeRupeeToken.deployed()
      .then((_deployedToken) => {
        deployedToken = _deployedToken;
        fromAccount = accounts[2];
        toAccount = accounts[3];
        spendingAccount = accounts[4];
        // transfer some tokens form accounts[0] to fromAccount (accounts[2]) for testing
        return deployedToken.transfer(fromAccount, 100, {
          from: accounts[0],
        });
      })
      // accounts[2] is giving approval to accounts[4] to spend some tokens
      .then((receipt) =>
        deployedToken.approve(spendingAccount, 10, { from: fromAccount })
      )
      .then((receipt) => {
        // transferring greater than the balance
        return deployedToken.transferFrom(fromAccount, toAccount, 101, {
          from: spendingAccount,
        });
      })
      .then(assert.fail)
      .catch((error) => {
        assert(
          error.message.indexOf("revert") >= 0,
          "cannot transfer value larger than balance"
        );
        // transferring greater than the approved amount
        return deployedToken.transferFrom(fromAccount, toAccount, 20, {
          from: spendingAccount,
        });
      })
      .then(assert.fail)
      .catch((error) => {
        assert(
          error.message.indexOf("revert") >= 0,
          "cannot transfer value larger than the approved amount"
        );
        return deployedToken.transferFrom.call(fromAccount, toAccount, 10, {
          from: spendingAccount,
        });
      })
      .then((success) => {
        assert.equal(success, true);
        return deployedToken.transferFrom(fromAccount, toAccount, 10, {
          from: spendingAccount,
        });
      })
      .then((receipt) => {
        assert.equal(receipt.logs.length, 1, "triggers one event");
        assert.equal(
          receipt.logs[0].event,
          "Transfer",
          "should be the 'Transfer' event"
        );
        assert.equal(
          receipt.logs[0].args._from,
          fromAccount,
          "logs the account the tokens are transferred by"
        );
        assert.equal(
          receipt.logs[0].args._to,
          toAccount,
          "logs the account the tokens are transferred to"
        );
        assert.equal(
          receipt.logs[0].args._value,
          10,
          "logs the transfer amount"
        );
        return deployedToken.balanceOf(fromAccount);
      })
      .then((balance) => {
        assert.equal(
          balance.toNumber(),
          90,
          "deducts the amount from the sending account"
        );
        return deployedToken.balanceOf(toAccount);
      })
      .then((balance) => {
        assert.equal(
          balance.toNumber(),
          10,
          "adds the amount to the receiving account"
        );
        return deployedToken.allowance(fromAccount, spendingAccount);
      })
      .then((allowance) =>
        assert.equal(allowance, 0, "deducts the amount from the allowance")
      ));
});
