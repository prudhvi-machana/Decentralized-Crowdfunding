import React, { useEffect, useState } from 'react';
import crowdfunding from './crowdfunding';
import web3 from './web3';

const CampaignList = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [contribution, setContribution] = useState({});
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingTx, setPendingTx] = useState(false);
  const [expandedContributors, setExpandedContributors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState(null);

  // Connect wallet function
  const connectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccounts(accounts);
      return accounts;
    } catch (error) {
      alert("Please connect your MetaMask wallet to continue");
      return [];
    }
  };

  // Toggle contributors visibility
  const toggleContributors = (campaignId) => {
    setExpandedContributors(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }));
  };

  // Fetch campaigns and accounts
  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        const accs = await web3.eth.getAccounts();
        setAccounts(accs);
        
        // Fetch campaign data
        const count = await crowdfunding.methods.getCampaignCount().call();
        let temp = [];
        for (let i = 1; i <= count; i++) {
          const c = await crowdfunding.methods.getCampaign(i).call();
          temp.push({ id: i, ...c });
        }
        
        // Fetch backers for each campaign
        const campaignsWithBackers = await Promise.all(
          temp.map(async (campaign) => {
            try {
              const backers = await crowdfunding.methods.getBackers(campaign.id).call();
              
              // Get contribution amount for each backer
              const backersWithAmounts = await Promise.all(
                backers.map(async (address) => {
                  const amount = await crowdfunding.methods.getContribution(campaign.id, address).call();
                  return { address, amount };
                })
              );
              
              // Sort backers by contribution amount (high to low)
              const sortedBackers = backersWithAmounts.sort(
                (a, b) => parseFloat(web3.utils.fromWei(b.amount, 'ether')) - 
                          parseFloat(web3.utils.fromWei(a.amount, 'ether'))
              );
              
              return { ...campaign, backers: sortedBackers };
            } catch (err) {
              console.error(`Error fetching backers for campaign ${campaign.id}:`, err);
              return { ...campaign, backers: [] };
            }
          })
        );
        
        // Sort campaigns by newest first by default
        campaignsWithBackers.sort((a, b) => b.id - a.id);
        setCampaigns(campaignsWithBackers);
      } catch (err) {
        console.error("Error fetching data:", err);
        alert("Error fetching campaigns: " + err.message);
      }
      setLoading(false);
    };
    fetchCampaigns();
  }, []);

  // Handle contribution
  const handleContribute = async (id) => {
    setPendingTx(true);
    try {
      // Check if we have accounts, if not, connect wallet
      let currentAccounts = accounts;
      if (!currentAccounts || currentAccounts.length === 0) {
        currentAccounts = await connectWallet();
        if (currentAccounts.length === 0) {
          setPendingTx(false);
          return; // Exit if no accounts available
        }
      }

      const value = contribution[id] || "0";
      if (parseFloat(value) <= 0) {
        alert("Please enter a valid contribution amount.");
        setPendingTx(false);
        return;
      }

      console.log("Sending from account:", currentAccounts[0]);
      await crowdfunding.methods.contribute(id).send({
        from: currentAccounts[0],
        value: web3.utils.toWei(value, "ether")
      });
      
      alert("Contribution successful!");
      window.location.reload();
    } catch (err) {
      console.error("Contribution error:", err);
      alert("Contribution failed: " + err.message);
    }
    setPendingTx(false);
  };

  // Handle release or refund
  const handleReleaseOrRefund = async (id) => {
    try {
      let currentAccounts = accounts;
      if (!currentAccounts || currentAccounts.length === 0) {
        currentAccounts = await connectWallet();
        if (currentAccounts.length === 0) return;
      }

      console.log("Sending from account:", currentAccounts[0]);
      await crowdfunding.methods.releaseOrRefund(id).send({ 
        from: currentAccounts[0] 
      });
      
      alert("Funds released or refunded!");
      window.location.reload();
    } catch (err) {
      console.error("Release/refund error:", err);
      alert("Operation failed: " + err.message);
    }
  };

  if (loading) return <div>Loading campaigns...</div>;
  const now = Date.now() / 1000;

  // Filter campaigns by search term and status
  let filteredCampaigns = campaigns.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));
  
  // Apply status filtering based on sortOrder
  if (sortOrder === 'active') {
    filteredCampaigns = filteredCampaigns.filter(c => !c.fundsReleased && Number(c.deadline) > now);
  } else if (sortOrder === 'completed') {
    filteredCampaigns = filteredCampaigns.filter(c => c.fundsReleased || Number(c.deadline) <= now);
  }

  return (
    <div>
      {/* Search and Sort Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold mr-3">Campaigns</h2>
          <select
            value={sortOrder || ''}
            onChange={e => setSortOrder(e.target.value || null)}
            className="ml-2 px-3 py-2 border rounded-md bg-white"
          >
            <option value="">All Campaigns</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Search campaigns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Campaign Grid */}
      {filteredCampaigns.length === 0 ? (
        <p className="text-center text-gray-600">No campaigns found matching your search.</p>
      ) : (
        <div className="space-y-6">
          {filteredCampaigns.map((c) => {
            const isExpired = Number(c.deadline) < now;
            return (
              <div key={c.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{c.title}</h3>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm">
                      <span className="font-medium">Goal:</span> {web3.utils.fromWei(c.goal, 'ether')} ETH
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Raised:</span> {web3.utils.fromWei(c.amountRaised, 'ether')} ETH
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Deadline:</span> {new Date(Number(c.deadline) * 1000).toLocaleString()}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Status:</span> {c.fundsReleased ? 'Completed' : isExpired ? 'Ended' : 'Active'}
                    </p>
                  </div>

                  {/* Contributors section with dropdown */}
                  <div className="mt-3 mb-3">
                    <div 
                      className="flex items-center cursor-pointer" 
                      onClick={() => toggleContributors(c.id)}
                    >
                      <h4 className="text-md font-medium mr-2">
                        Contributors: {c.backers.length}
                      </h4>
                      <svg 
                        className={`w-4 h-4 transition-transform ${expandedContributors[c.id] ? 'transform rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {expandedContributors[c.id] && (
                      <div className="mt-2 max-h-40 overflow-y-auto">
                        {c.backers && c.backers.length > 0 ? (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-1">Address</th>
                                <th className="text-right py-1">Amount (ETH)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {c.backers.map((backer, idx) => (
                                <tr key={idx} className="border-b border-gray-100">
                                  <td className="py-1 break-all text-gray-600">
                                    {backer.address.substring(0, 6)}...{backer.address.substring(backer.address.length - 4)}
                                  </td>
                                  <td className="py-1 text-right font-medium">
                                    {web3.utils.fromWei(backer.amount, 'ether')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No contributors yet</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <input
                      type="number"
                      placeholder="ETH to contribute"
                      value={contribution[c.id] || ""}
                      onChange={e => setContribution({ ...contribution, [c.id]: e.target.value })}
                      disabled={c.fundsReleased || isExpired}
                      className="w-full mb-3 px-3 py-2 border rounded-md"
                      min="0"
                      step="0.01"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleContribute(c.id)}
                        disabled={c.fundsReleased || isExpired || pendingTx}
                        className={`bg-blue-600 text-white px-4 py-2 rounded-md flex-1 hover:bg-blue-700 disabled:opacity-50`}
                      >
                        {pendingTx ? 'Processing...' : 'Contribute'}
                      </button>
                      {!c.fundsReleased && (
                        <button
                          onClick={() => handleReleaseOrRefund(c.id)}
                          className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800"
                        >
                          Release/Refund
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CampaignList;
