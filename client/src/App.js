import React from 'react';
import CreateCampaign from './CreateCampaign';
import CampaignList from './CampaignList';
import './App.css';
import logo from './assets/logo.png';



function App() {
  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#64B5F6' }}>
  <img
    src={logo}
    alt="Logo"
    className="absolute top-4 right-6 w-12 h-12 object-contain z-50"
  />
  <header className="py-6 mb-8">
    <h1 className="text-4xl font-bold text-center text-white drop-shadow-lg">
      Decentralized Crowdfunding Platform
    </h1>
  </header>
  <main className="max-w-3xl mx-auto px-4">
    <CreateCampaign />
    <div className="my-8" />
    <CampaignList />
  </main>
</div>

  );
}

export default App;