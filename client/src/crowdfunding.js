//Crowdfunding.js
import web3 from './web3';
import Crowdfunding from './Crowdfunding.json';

// Replace with your deployed contract address
const address = '0xe2Bc5DD763317a2f5b93F72Feb3E80D20507d031';

const instance = new web3.eth.Contract(
  Crowdfunding.abi,
  address
);

export default instance;
