
# Decentralized Crowdfunding Platform

A blockchain-based crowdfunding platform built with Solidity, Truffle, Ganache, React, and Web3.js. This platform allows users to create campaigns, contribute ETH, and manually release or refund funds after the campaign deadline.

---

## Team Members

| Name           | Roll Number |
|----------------|-------------|
| Alice Example  | 21CS1001    |
| Bob Example    | 21CS1002    |
| Carol Example  | 21CS1003    |

---

## Project Overview

This project demonstrates a decentralized crowdfunding system where:
- Anyone can create a fundraising campaign with a goal and deadline.
- Users can contribute ETH to active campaigns.
- If the goal is met by the deadline, the campaign creator can claim the funds.
- If the goal is not met, contributors are refunded.
- After the deadline, any user can manually trigger the release or refund.

---

## Prerequisites

- [Node.js & npm](https://nodejs.org/)
- [Truffle](https://trufflesuite.com/truffle/)
- [Ganache GUI](https://trufflesuite.com/ganache/)
- [MetaMask](https://metamask.io/) browser extension

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd crowdfunding-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install OpenZeppelin Contracts

```bash
npm install @openzeppelin/contracts
```

### 4. Start Ganache

- Open Ganache GUI and start a new workspace.
- Use the default settings:
  - RPC Server: `http://127.0.0.1:7545`
  - Chain ID: `1337`

### 5. Compile and Deploy the Smart Contract

```bash
truffle compile
truffle migrate --network ganache
```

### 6. Set Up the Frontend

```bash
cd frontend
npm install
```

- Copy `Crowdfunding.json` from `../build/contracts/` to `frontend/src/`.
- In `frontend/src/crowdfunding.js`, update the contract address with your deployed contract address.

### 7. Start the React Frontend

```bash
npm start
```

- Open your browser and go to: [http://localhost:3000](http://localhost:3000)

### 8. Connect MetaMask

- Add a custom network in MetaMask:
  - **Network Name:** Ganache
  - **New RPC URL:** `http://127.0.0.1:7545`
  - **Chain ID:** `1337`
- Import one or more accounts from Ganache into MetaMask using private keys.

---

## Usage

1. **Create a Campaign**  
   Enter a campaign title, goal (in ETH), and duration (in seconds), then click **Create Campaign**.

2. **Contribute to a Campaign**  
   Input an amount and click **Contribute**. Confirm the transaction in MetaMask.

3. **Manual Release or Refund**  
   After the deadline has passed, any user can manually trigger the `releaseOrRefund` function for a campaign.  
   - If the goal was met, funds are released to the creator.  
   - If not, all contributors are refunded.

---

## Notes

- There is no automation or external service involved.
- You must **manually trigger** fund release/refund after the deadline.
- For local testing, you can call the `releaseOrRefund` function via the frontend or Truffle console.
- MetaMask must be connected to the Ganache network with an imported account.

---

## Troubleshooting

- **MetaMask shows wrong account balance:**  
  Ensure you've imported the correct account from Ganache and selected the right network.

- **Frontend not interacting with contract:**  
  Verify the contract address in `frontend/src/crowdfunding.js` is correct and matches your deployment.

- **Campaign not updating after deadline:**  
  Make sure to manually trigger the `releaseOrRefund` function. There’s no automation to handle it automatically.
