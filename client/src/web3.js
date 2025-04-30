import Web3 from 'web3';

let web3;

if (typeof window !== "undefined" && window.ethereum) {
  web3 = new Web3(window.ethereum);
  // We don't request accounts here - it's better to do this on user action
} else if (typeof window !== "undefined" && window.web3) {
  web3 = new Web3(window.web3.currentProvider);
} else {
  console.warn("No Ethereum provider detected. Please install MetaMask!");
}

export default web3;
