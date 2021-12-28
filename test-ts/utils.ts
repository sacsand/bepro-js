import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Web3Connection} from '@base/web3-connection';
import {ERC20} from '@models/erc20';
import {toSmartContractDecimals} from '@utils/numbers';

export function defaultWeb3Connection() {
  const options: Web3ConnectionOptions = {
    web3Host: process.env.WEB3_HOST_PROVIDER,
    privateKey: process.env.WALLET_PRIVATE_KEY,
    skipWindowAssignment: true,
  }

  return new Web3Connection(options);
}

export async function erc20Deployer(name: string, symbol: string, cap = toSmartContractDecimals(1000000, 18) as number, web3Connection: Web3Connection|Web3ConnectionOptions) {
  if (!(web3Connection instanceof Web3Connection))
    web3Connection = new Web3Connection(web3Connection)

  await web3Connection.start();

  const deployer = new ERC20(web3Connection);
  await deployer.loadAbi();

  const address = await deployer.connection.getAddress();
  return deployer.deployJsonAbi(name, symbol, cap, address);
}

export function newWeb3Account(web3Connection: Web3Connection) {
  return web3Connection.Web3.eth.accounts.create(`0xB3pR0Te511Ng`);
}
