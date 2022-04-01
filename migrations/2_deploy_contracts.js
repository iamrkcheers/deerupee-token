const DeeRupeeToken = artifacts.require("DeeRupeeToken");
const DeeRupeeTokenSale = artifacts.require("DeeRupeeTokenSale");

module.exports = function (deployer) {
  deployer.deploy(DeeRupeeToken, 1000000).then(() => {
    // setting the price of the token at 0.001 eth
    var tokenPrice = 1000000000000000;
    return deployer.deploy(
      DeeRupeeTokenSale,
      DeeRupeeToken.address,
      tokenPrice
    );
  });
};
