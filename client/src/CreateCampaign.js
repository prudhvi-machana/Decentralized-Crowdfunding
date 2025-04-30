import React, { useState, useEffect } from 'react';
import crowdfunding from './crowdfunding';
import web3 from './web3';

const CreateCampaign = () => {
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const accs = await web3.eth.getAccounts();
        setAccounts(accs);
      } catch (err) {
        console.error("Error fetching accounts:", err);
      }
    }
    fetchAccounts();
  }, []);

  // Connect wallet function
  const connectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccounts(accounts);
      return accounts;
    } catch (error) {
      alert("Please connect your MetaMask wallet to create a campaign");
      return [];
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !goal || !deadline) {
      return alert("Please fill all fields");
    }

    // Convert datetime to Unix timestamp
    const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);
    const currentTime = Math.floor(Date.now() / 1000);
    const duration = deadlineTimestamp - currentTime;

    if (duration <= 0) {
      alert("Please select a future date and time");
      return;
    }

    // Check if we have accounts, if not, connect wallet
    let currentAccounts = accounts;
    if (!currentAccounts || currentAccounts.length === 0) {
      currentAccounts = await connectWallet();
      if (currentAccounts.length === 0) return;
    }

    setLoading(true);
    try {
      await crowdfunding.methods
        .createCampaign(
          title,
          web3.utils.toWei(goal, 'ether'),
          duration
        )
        .send({ from: currentAccounts[0] });
      
      alert("Campaign created successfully!");
      setTitle('');
      setGoal('');
      setDeadline('');
      window.location.reload();
    } catch (err) {
      alert("Failed to create campaign: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-center mb-6">Create New Campaign</h2>
      
      {(!accounts[0] || accounts.length === 0) ? (
  <div className="mb-6 text-center">
    <button 
      onClick={connectWallet}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
    >
      Connect Wallet to Create Campaign
    </button>
  </div>
) : (
  <div className="mb-6 text-center text-green-600 font-semibold">
    Wallet Connected: {accounts[0].substring(0, 6)}...{accounts[0].substring(accounts[0].length - 4)}
  </div>
)}


      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Campaign Title</label>
          <input
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter campaign title"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Funding Goal (ETH)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Campaign Deadline</label>
            <input
              type="datetime-local"
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || accounts.length === 0}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating Campaign...' : 'Launch Campaign'}
        </button>
      </form>
    </div>
  );
};

export default CreateCampaign;
