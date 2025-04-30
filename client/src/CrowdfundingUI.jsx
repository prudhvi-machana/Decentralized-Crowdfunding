import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// --- Contract Constants ---
const CONTRACT_ABI = [
  "function createCampaign(string _title, uint256 _goal, uint256 _duration)",
  "function contribute(uint256 _campaignId) payable",
  "function releaseOrRefund(uint256 _campaignId)",
  "function getCampaignCount() public view returns (uint256)",
  "function getCampaign(uint256 _campaignId) public view returns (address,string,uint256,uint256,uint256,bool)",
  "function getBackers(uint256 _campaignId) public view returns (address[] memory)",
  "function getContribution(uint256 _campaignId, address _backer) public view returns (uint256)"
];
const CONTRACT_ADDRESS = '0xe2Bc5DD763317a2f5b93F72Feb3E80D20507d031';

// --- Wallet Hook ---
function useWallet() {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return false;
    }
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        return true;
      }
      return false;
    } catch (err) {
      alert("Failed to connect wallet.");
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) setAccount(accounts[0]);
        });
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) setAccount(accounts[0]);
        else setAccount(null);
      });
    }
  }, []);

  return { account, connectWallet, isConnecting };
}

// --- Contract Hook ---
function useCrowdfundingContract() {
  const [contract, setContract] = useState(null);
  
  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      setContract(new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer));
    }
  }, []);

  return contract;
}

// --- Campaign Creation Form ---
function CampaignCreationForm({ onCreated }) {
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const contract = useCrowdfundingContract();
  const { account, connectWallet, isConnecting } = useWallet();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !goal || !duration) return alert("Fill all fields");
    if (!contract) return alert("Contract not loaded!");
    
    if (!account) {
      const connected = await connectWallet();
      if (!connected) return;
    }

    setLoading(true);
    try {
      const tx = await contract.createCampaign(
        title,
        ethers.utils.parseEther(goal),
        Number(duration)
      );
      await tx.wait();
      alert("Campaign created!");
      setTitle('');
      setGoal('');
      setDuration('');
      onCreated?.();
    } catch (err) {
      alert("Transaction failed: " + (err?.reason || err?.message || err));
    }
    setLoading(false);
  };

  return (
    <div className="flex items-start justify-between mb-8">
      <form onSubmit={handleCreate} className="bg-white p-6 rounded shadow max-w-lg w-3/4">
        <h2 className="text-xl font-bold mb-4 text-center">Create Campaign</h2>
        <input
          className="block w-full mb-3 p-2 border rounded"
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <input
          className="block w-full mb-3 p-2 border rounded"
          type="number"
          placeholder="Goal (ETH)"
          value={goal}
          onChange={e => setGoal(e.target.value)}
          min="0"
          step="0.01"
          required
        />
        <input
          className="block w-full mb-3 p-2 border rounded"
          type="number"
          placeholder="Duration (seconds)"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          min="1"
          required
        />
        <button
          type="submit"
          disabled={loading || !account}
          className={`w-full bg-blue-600 text-white px-4 py-2 rounded ${loading || !account ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
        >
          {loading ? "Creating..." : "Create Campaign"}
        </button>
      </form>
      
      <div className="ml-4 w-1/4">
        {!account ? (
          <div>
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className={`bg-orange-500 text-white px-4 py-2 rounded w-full ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'}`}
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
            <p className="mt-2 text-sm text-gray-600">
              Connect wallet for campaign creation and contributions.
            </p>
          </div>
        ) : (
          <div className="text-green-600 font-semibold">
            <p>Wallet Connected</p>
            <p className="text-xs truncate">
              {account.substring(0, 6)}...{account.substring(account.length - 4)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Campaign List Component ---
function CampaignList({ refresh }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contribution, setContribution] = useState({});
  const [pendingTx, setPendingTx] = useState(false);
  const [expandedContributors, setExpandedContributors] = useState({});
  const contract = useCrowdfundingContract();
  const { account, connectWallet } = useWallet();

  const toggleContributors = (campaignId) => {
    setExpandedContributors(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }));
  };

  useEffect(() => {
    async function fetchCampaigns() {
      if (!contract) return;
      setLoading(true);
      try {
        const count = await contract.getCampaignCount();
        let temp = [];
        for (let i = 0; i < count; i++) {
          const c = await contract.getCampaign(i);
          temp.push({
            id: i,
            creator: c[0],
            title: c[1],
            goal: c[2],
            deadline: c[3],
            amountRaised: c[4],
            fundsReleased: c[5],
          });
        }
        
        const campaignsWithBackers = await Promise.all(
          temp.map(async (campaign) => {
            try {
              const backers = await contract.getBackers(campaign.id);
              const backersWithAmounts = await Promise.all(
                backers.map(async (address) => {
                  const amount = await contract.getContribution(campaign.id, address);
                  return { address, amount };
                })
              );
              
              const sortedBackers = backersWithAmounts.sort(
                (a, b) => b.amount.sub(a.amount).isNegative() ? -1 : 1
              );
              
              return { ...campaign, backers: sortedBackers };
            } catch (err) {
              console.error(`Error fetching backers for campaign ${campaign.id}:`, err);
              return { ...campaign, backers: [] };
            }
          })
        );
        
        campaignsWithBackers.sort((a, b) => b.id - a.id);
        setCampaigns(campaignsWithBackers);
      } catch (err) {
        alert("Error fetching campaigns: " + (err?.reason || err?.message || err));
      }
      setLoading(false);
    }
    fetchCampaigns();
  }, [contract, refresh]);

  const handleContribute = async (id) => {
    if (!contract) return alert("Contract not loaded!");
    if (!account) {
      const connected = await connectWallet();
      if (!connected) return;
    }
    const value = contribution[id] || "0";
    if (parseFloat(value) <= 0) return alert("Enter a valid amount.");
    setPendingTx(true);
    try {
      const tx = await contract.contribute(id, {
        value: ethers.utils.parseEther(value)
      });
      await tx.wait();
      setContribution({ ...contribution, [id]: "" });
      alert("Contribution successful!");
    } catch (err) {
      alert("Contribution failed: " + (err?.reason || err?.message || err));
    }
    setPendingTx(false);
  };

  const handleReleaseOrRefund = async (id) => {
    if (!contract) return alert("Contract not loaded!");
    if (!account) {
      const connected = await connectWallet();
      if (!connected) return;
    }
    try {
      const tx = await contract.releaseOrRefund(id);
      await tx.wait();
      alert("Funds released or refunded!");
    } catch (err) {
      alert("Operation failed: " + (err?.reason || err?.message || err));
    }
  };

  if (loading) return <div>Loading campaigns...</div>;
  const now = Math.floor(Date.now() / 1000);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Campaigns</h2>
      {campaigns.length === 0 && <p>No campaigns found.</p>}
      {campaigns.map((c) => {
        const isExpired = Number(c.deadline) < now;
        return (
          <div key={c.id} className="border rounded p-4 mb-4 bg-white shadow">
            <h3 className="text-lg font-semibold">{c.title}</h3>
            <p>Goal: {ethers.utils.formatEther(c.goal)} ETH</p>
            <p>Deadline: {new Date(Number(c.deadline) * 1000).toLocaleString()}</p>
            <p>Raised: {ethers.utils.formatEther(c.amountRaised)} ETH</p>
            <p>Status: {c.fundsReleased ? "Completed" : (isExpired ? "Ended" : "Active")}</p>
            
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
                  {c.backers.length > 0 ? (
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
                              {ethers.utils.formatEther(backer.amount.toString())}
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
            
            <input
              type="number"
              placeholder="ETH to contribute"
              value={contribution[c.id] || ""}
              onChange={e => setContribution({ ...contribution, [c.id]: e.target.value })}
              disabled={c.fundsReleased || isExpired}
              className="border rounded p-2 mr-2"
              min="0"
              step="0.01"
            />
            <button
              onClick={() => handleContribute(c.id)}
              disabled={c.fundsReleased || isExpired || pendingTx}
              className={`bg-blue-600 text-white px-3 py-1 rounded mr-2 ${pendingTx ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            >
              {pendingTx ? "Processing..." : "Contribute"}
            </button>
            {!c.fundsReleased && (
              <button
                onClick={() => handleReleaseOrRefund(c.id)}
                className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800"
              >
                Release/Refund
              </button>
            )}
            {account && c.creator.toLowerCase() === account.toLowerCase() && (
              <span className="ml-2 text-green-600 font-semibold">(You are the creator)</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Main UI Component ---
export default function CrowdfundingUI() {
  const [refresh, setRefresh] = useState(false);
  return (
    <div className="max-w-3xl mx-auto px-4">
      <CampaignCreationForm onCreated={() => setRefresh(r => !r)} />
      <CampaignList refresh={refresh} />
    </div>
  );
}
