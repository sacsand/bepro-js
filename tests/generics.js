const { Application } = require('..');
import { assert, expect } from "chai";
import { mochaAsync } from "./utils";
import { ERC20Contract } from "../build";
import Numbers from "../build/utils/Numbers";
import Account from "../build/utils/Account";

const ETH_URL_LOCAL_TEST = 'http://localhost:8545';

//var contractAddress = '0x949d274F63127bEd53e21Ed1Dd83dD6ACAfF7f64';
// this is already deployed on rinkeby network for testing
var contractAddress = "0x4197A48d240B104f2bBbb11C0a43fA789f2A5675";
var deployed_tokenAddress = contractAddress;
const testConfig = {
  test: true,
  localtest: true, //ganache local blockchain
};

// NOTE: We only test ERC20contract because all the other models are similar
// We want to test generic behaviour like connect to RINKEBY TESTNET and MAINNET and check expected values
context("Generics", async () => {
  let erc20;

  before(async () => {
    //erc20 = new ERC20Contract(testConfig);
  });

  it(
    "should be able to import directly via require(..)",
    mochaAsync(async () => {
      console.log("app", Application);
      expect(Application).to.not.equal(null);
    })
  );



  it(
    "should start the ERC20Contract on RINKEBY TESTNET",
    mochaAsync(async () => {
      erc20 = new ERC20Contract({ test: true });
      expect(erc20).to.not.equal(null);

      let userAddr = await erc20.getUserAddress();
      console.log("---erc20.userAddress: " + userAddr);

      let networkName = await erc20.getETHNetwork();
      console.log("---erc20.networkName: " + networkName);
      expect(networkName).to.equal("Rinkeby");
    })
  );

  it(
    "no-params constructor should fail to start a new ERC20Contract correctly",
    mochaAsync(async () => {
      // this should fail because we are not on TEST net and are NOT connected to MAIN net either
      erc20 = new ERC20Contract();
      expect(erc20).to.not.equal(null);

      try {
        // load web3 connection
        await erc20.start();

        assert.fail();
        console.log("---log erc20.start() this should not be reached");
      } catch (err) {
        console.log("---log erc20.start().error: " + err.message);
        assert(
          err.message.indexOf(
            "Please Use an Ethereum Enabled Browser like Metamask or Coinbase Wallet"
          ) >= 0,
          "erc20.start() should fail with expected error"
        );
      }

      let userAddr = await erc20.getUserAddress();
      console.log("---erc20.userAddress: " + userAddr);
      expect(userAddr).to.equal(undefined);
    })
  );

  it(
    "should fail to start a new ERC20Contract on MAINNET from test",
    mochaAsync(async () => {
      erc20 = new ERC20Contract({
        opt: {
          web3Connection:
            "https://mainnet.infura.io/v3/37ec248f2a244e3ab9c265d0919a6cbc",
        },
      });
      expect(erc20).to.not.equal(null);

      // should fail to login on MAINNET since we are testing and have no wallet
      let logedIn = await erc20.login();
      expect(logedIn).to.equal(false);

      // should fail to get any data since we have no web3 connection
      try {
        let userAddr = await erc20.getUserAddress();
        console.log("---erc20.userAddress: " + userAddr);

        assert.fail();
      } catch (err) {
        console.log("---log erc20.getUserAddress().error: " + err.message);
        assert(
          err.message.indexOf("undefined") >= 0,
          "erc20.getUserAddress should fail with expected error"
        );
      }
    })
  );

  it('should switch wallet - ganache local test', async () => {
    const validateWallet = function (wallet1) {
      assert.notEqual(wallet1, undefined, 'undefined wallet');
      assert.notEqual(wallet1, null, 'null wallet');
    }
    
    const erc20test = new ERC20Contract(testConfig);
    expect(erc20test).to.not.equal(null);

    //const wallet0 = wallets[0];
    //const wallet1 = wallets[1];
    //const wallet2 = wallets[2];
    //const wallet3 = wallets[3];
    const [wallet0, wallet1, wallet2, wallet3] = await erc20test.getSigners();
    // assert we have all these wallets and we are NOT on a test net like rinkeby with a single account
    validateWallet(wallet0);
    validateWallet(wallet1);
    validateWallet(wallet2);
    validateWallet(wallet3);
    
    const acc0Read = await erc20test.getUserAddress();
    expect(acc0Read).to.equal(wallet0);

    // chain operations after wallet switch is possible
    const acc1Read = await erc20test.switchWallet(wallet1).getUserAddress();
    expect(acc1Read).to.equal(wallet1);

    erc20test.switchWallet(wallet2);
    const acc2Read = await erc20test.getUserAddress();
    expect(acc2Read).to.equal(wallet2);

    erc20test.switchWallet(wallet3);
    const acc3Read = await erc20test.getUserAddress();
    expect(acc3Read).to.equal(wallet3);
  });

  it('should switch wallet - private key accounts test', async () => {
    const validateWallet = function (wallet1) {
      assert.notEqual(wallet1, undefined, 'undefined wallet');
      assert.notEqual(wallet1, null, 'null wallet');
    }
    
    const pubk1 = '0xd766942671Dc3f32510a7762E086f1B52a838bF3';
    const pk1 = '0x1dcc1d24e039ee0c5329f2ae9cd0b7a7b6db6c8fba37cb67d84a428710a086af';
    const pubk2 = '0x8c554Ed11fbb480a750e27F0671788A9cA78c975';
    const pk2 = '0x43a594a8d8a442fb3811100abb6ce2dfd65ae33795779a513dc2a969ea4e12c5';
    
    const erc20test = new ERC20Contract({ test: true, opt: { web3Connection: ETH_URL_LOCAL_TEST, privateKey: pk1 }});
    expect(erc20test).to.not.equal(null);

    //const wallet0 = wallets[0];
    //const wallet1 = wallets[1];
    //const wallet2 = wallets[2];
    //const wallet3 = wallets[3];
    const [wallet0, wallet1] = await erc20test.getSigners();
    console.log('wallet1: ', wallet1);
    // assert we have all these wallets and we are NOT on a test net like rinkeby with a single account
    validateWallet(wallet0);
    expect(wallet0).to.equal(pubk1);

    // non existent wallet should be null
    expect(wallet1 === undefined || wallet1 == null).to.equal(true);
    
    const acc0Read = await erc20test.getUserAddress();
    expect(acc0Read).to.equal(pubk1);

    // create and switch to a new account from private key
    const acc2 = new Account(
      erc20test.web3Connection.getWeb3(),
      erc20test.web3Connection.getWeb3().eth.accounts.privateKeyToAccount(pk2),
    );
    expect(acc2.getAddress()).to.equal(pubk2);

    // switch wallet
    erc20test.switchWallet(acc2);
    const acc2Read = await erc20test.getUserAddress();
    expect(acc2Read).to.equal(pubk2);
  });
});
