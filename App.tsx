import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Provisions } from './components/Provisions';
import { Leads } from './components/Leads';
import { Orders } from './components/Orders';
import { Invoices } from './components/Invoices';
import { Calls } from './components/Calls';
import { Conversions } from './components/Conversions';
import { Reports } from './components/Reports';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'provisions': return <Provisions />;
      case 'orders': return <Orders />;
      case 'invoices': return <Invoices />;
      case 'leads': return <Leads />;
      case 'calls': return <Calls />;
      case 'conversions': return <Conversions />;
      case 'reports': return <Reports />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-300">Work in Progress</h2>
            <p className="text-gray-400 mt-2">This module ({activePage}) is currently under development.</p>
          </div>
        );
    }
  };

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {renderContent()}
    </Layout>
  );
};

export default App;