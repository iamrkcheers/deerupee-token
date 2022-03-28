const DeeRupeeToken = artifacts.require("DeeRupeeToken");

module.exports = function (deployer) {
  deployer.deploy(DeeRupeeToken, 1000000);
};
