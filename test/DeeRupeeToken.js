const DeeRupeeToken = artifacts.require("./DeeRupeeToken.sol");

contract("DeeRupeeToken", (accounts) => {
  it("sets the total supply upon deployment", () =>
    DeeRupeeToken.deployed()
      .then((deployedToken) => deployedToken.totalSupply())
      .then((totalSupply) =>
        assert.equal(
          totalSupply.toNumber(),
          1000000,
          "sets the total supply upon deployment"
        )
      ));
});
