text
# Decentralized Crowdfunding Platform

A blockchain-based crowdfunding platform built with Solidity, Truffle, Ganache, React, and Web3.js. This platform allows users to create campaigns, contribute ETH, and automatically releases or refunds funds after the campaign deadline using Chainlink Keepers.

---

## Team Members

| Name                | Roll Number     |
|---------------------|-----------------|
| Alice Example       | 21CS1001        |
| Bob Example         | 21CS1002        |
| Carol Example       | 21CS1003        |

---

## Project Overview

This project demonstrates a decentralized crowdfunding system where:
- Anyone can create a fundraising campaign with a goal and deadline.
- Users can contribute ETH to active campaigns.
- If the goal is met by the deadline, the campaign creator can claim the funds.
- If the goal is not met, contributors are refunded.
- The process can be automated using Chainlink Keepers.

---

## Prerequisites

- [Node.js & npm](https://nodejs.org/)
- [Truffle](https://trufflesuite.com/truffle/)
- [Ganache GUI](https://trufflesuite.com/ganache/)
- [MetaMask](https://metamask.io/) browser extension
- [Chainlink Keepers](https://automation.chain.link/) (for automation, optional for local testing)

---

## Installation & Setup

### 1. Clone the Repository

git clone <your-repo-url>
cd crowdfunding-platform


### 2. Install Dependencies

npm install


### 3. Install OpenZeppelin and Chainlink Contracts

npm install @openzeppelin/contracts @chainlink/contracts


### 4. Start Ganache

- Open Ganache GUI and start a new workspace.
- Default RPC: `http://127.0.0.1:7545`
- Chain ID: `1337`

### 5. Compile and Deploy the Smart Contract

truffle compile
truffle migrate --network ganache


### 6. Set Up the Frontend

cd frontend
npm install


- Copy the `Crowdfunding.json` file from `../build/contracts/` to `frontend/src/`.
- In `frontend/src/crowdfunding.js`, update the contract address to match your deployed address.

### 7. Start the React Frontend

npm start


- Open [http://localhost:3000](http://localhost:3000) in your browser.

### 8. Connect MetaMask

- Add a custom network in MetaMask:
  - **Network Name:** Ganache
  - **RPC URL:** `http://127.0.0.1:7545`
  - **Chain ID:** `1337`
- Import one or more private keys from Ganache into MetaMask.

---

## Usage

1. **Create a Campaign:**  
   Fill in the campaign title, goal (ETH), and duration (seconds), then click "Create Campaign".

2. **Contribute to a Campaign:**  
   Enter an amount and click "Contribute". Approve the transaction in MetaMask.

3. **Automatic Release/Refund:**  
   After the deadline, Chainlink Keepers (or manual trigger) will release funds to the creator if the goal is met, or refund contributors if not.

---

## Notes

- For local testing, you can manually call the `releaseOrRefund` function after the campaign deadline.
- For automatic processing, deploy on a public testnet and register your contract with [Chainlink Automation](https://automation.chain.link/).
- Make sure MetaMask is connected to the Ganache network and using an imported Ganache account.

---

## Troubleshooting

- **MetaMask not showing correct balance:**  
  Ensure you imported the correct Ganache account and are connected to the Ganache network.

- **Contract not found:**  
  Double-check the deployed contract address in `frontend/src/crowdfunding.js`.

---


