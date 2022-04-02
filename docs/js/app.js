App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  loading: false,
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 750000,

  init: () => {
    console.log("App initialized...");
    return App.initWeb3();
  },

  initWeb3: () => {
    if (typeof web3 !== "undefined") {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
      web3 = new Web3(App.web3Provider);
    }
    return App.initContracts();
  },

  initContracts: () =>
    $.getJSON("DeeRupeeTokenSale.json", (deeRupeeTokenSale) => {
      // JS interaction with deployed contracts can be don directly using web3
      // but trufflecontract gives us some extra functionalities
      App.contracts.DeeRupeeTokenSale = TruffleContract(deeRupeeTokenSale);
      App.contracts.DeeRupeeTokenSale.setProvider(App.web3Provider);
      App.contracts.DeeRupeeTokenSale.deployed().then((deeRupeeTokenSale) =>
        console.log("DeeRupee Token Sale Address:", deeRupeeTokenSale.address)
      );
    }).done(() => {
      $.getJSON("DeeRupeeToken.json", (deeRupeeToken) => {
        App.contracts.DeeRupeeToken = TruffleContract(deeRupeeToken);
        App.contracts.DeeRupeeToken.setProvider(App.web3Provider);
        App.contracts.DeeRupeeToken.deployed().then((deeRupeeToken) =>
          console.log("DeeRupee Token Address:", deeRupeeToken.address)
        );

        App.listenForEvents();
        return App.render();
      });
    }),

  // Listen for events emitted from the contract
  listenForEvents: () =>
    App.contracts.DeeRupeeTokenSale.deployed().then((instance) =>
      instance
        .Sell(
          {},
          {
            fromBlock: 0,
            toBlock: "latest",
          }
        )
        .watch((error, event) => {
          console.log("event triggered", event);
          App.render();
        })
    ),

  render: () => {
    if (App.loading) {
      return;
    }
    App.loading = true;

    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase((err, account) => {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load token sale contract
    App.contracts.DeeRupeeTokenSale.deployed()
      .then((instance) => {
        deeRupeeTokenSaleInstance = instance;
        return deeRupeeTokenSaleInstance.tokenPrice();
      })
      .then((tokenPrice) => {
        App.tokenPrice = tokenPrice;
        $(".token-price").html(
          web3.fromWei(App.tokenPrice, "ether").toNumber()
        );
        return deeRupeeTokenSaleInstance.tokensSold();
      })
      .then((tokensSold) => {
        App.tokensSold = tokensSold.toNumber();
        $(".tokens-sold").html(App.tokensSold);
        $(".tokens-available").html(App.tokensAvailable);

        var progressPercent =
          (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
        $("#progress").css("width", progressPercent + "%");

        // Load token contract
        App.contracts.DeeRupeeToken.deployed()
          .then((instance) => {
            deeRupeeTokenInstance = instance;
            console.log(instance);
            return deeRupeeTokenInstance.balanceOf(App.account);
          })
          .then((balance) => {
            $(".dapp-balance").html(balance.toNumber());
            App.loading = false;
            loader.hide();
            content.show();
          });
      });
  },

  buyTokens: () => {
    $("#content").hide();
    $("#loader").show();
    var numberOfTokens = $("#numberOfTokens").val();
    App.contracts.DeeRupeeTokenSale.deployed()
      .then((instance) =>
        instance.buyTokens(numberOfTokens, {
          from: App.account,
          value: numberOfTokens * App.tokenPrice,
          gas: 500000, // Gas limit
        })
      )
      .then((result) => {
        console.log("Tokens bought...");
        $("form").trigger("reset"); // reset number of tokens in form
        // Wait for Sell event
      });
  },
};

$(() => $(window).load(() => App.init()));
