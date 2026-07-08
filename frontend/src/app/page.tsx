'use client';

import React, { useState } from 'react';
// Import matching stellar helper methods we created
import { connectWallet, submitAuditToRegistry } from './stellar';

export default function Home() {
  const [contractCode, setContractCode] = useState('');
  const [developerAddress, setDeveloperAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [txSuccess, setTxSuccess] = useState('');

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractCode.trim() || !developerAddress.trim()) {
      setError('Please fill in both the contract code and developer address.');
      return;
    }

    setError('');
    setTxSuccess('');
    setLoading(true);
    setAuditResult(null);

    try {
      const response = await fetch('http://localhost:8000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_code: contractCode,
          developer_address: developerAddress,
        }),
      });

      if (!response.ok) throw new Error('Failed to communicate with the auditing server.');
      const data = await response.json();
      setAuditResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected runtime anomaly occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Function to trigger Freighter Wallet signature and submit to Stellar Testnet
  const handleRegisterOnChain = async () => {
    if (!auditResult) return;
    
    setError('');
    setTxSuccess('');
    setTxLoading(true);

    try {
      // 1. Double check wallet connection and active account matches input
      const activeAddress = await connectWallet();
      if (activeAddress.toLowerCase() !== developerAddress.toLowerCase()) {
        throw new Error(`Connected wallet address (${activeAddress.slice(0,6)}...) does not match the Developer Address input.`);
      }

      // 2. Broadcast and execute Soroban smart contract invoke sequence
      const txResult = await submitAuditToRegistry(
        developerAddress,
        auditResult.contract_hash,
        auditResult.security_score,
        auditResult.critical_bugs
      );

      setTxSuccess(`Audit record successfully anchored on Stellar Testnet! Transaction Status: ${txResult.status}`);
    } catch (err: any) {
      setError(err.message || 'Failed to sign or broadcast the on-chain ledger record.');
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <header className="border-b border-slate-800 pb-4 text-center md:text-left">
          <h1 className="text-3xl font-extrabold text-indigo-400 tracking-tight">StellarShield 🛡️</h1>
          <p className="text-slate-400 text-sm mt-1">AI-Powered Soroban Smart Contract Vulnerability Auditor & Registry</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Input Panel */}
          <section className="bg-slate-800/50 p-5 rounded-xl border border-slate-800 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-200">Analysis Console</h2>
            <form onSubmit={handleRunAudit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Developer Public Address</label>
                <input
                  type="text"
                  placeholder="G... (Stellar Wallet Address)"
                  value={developerAddress}
                  onChange={(e) => setDeveloperAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Soroban Rust Contract Code</label>
                <textarea
                  rows={12}
                  placeholder="#![no_std] \nuse soroban_sdk::{contract, contractimpl}; ..."
                  value={contractCode}
                  onChange={(e) => setContractCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-mono text-emerald-400 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              {error && <p className="text-xs font-semibold text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">{error}</p>}
              {txSuccess && <p className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">{txSuccess}</p>}

              <button
                type="submit"
                disabled={loading || txLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-medium py-2.5 rounded-lg text-sm tracking-wide shadow-lg transition-all"
              >
                {loading ? 'Executing AI Analysis Rules...' : 'Run Security Scan'}
              </button>
            </form>
          </section>

          {/* Audit Outputs Display Block */}
          <section className="bg-slate-800/50 p-5 rounded-xl border border-slate-800 flex flex-col shadow-xl min-h-[350px]">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Audit Assessment Report</h2>
            
            {!auditResult && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-lg bg-slate-950/20">
                <p className="text-slate-500 text-sm">Paste your target smart contract source code and click scan to compile security intelligence reports.</p>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="h-8 w-8 rounded-full border-4 border-t-indigo-500 border-slate-700 animate-spin" />
                <p className="text-xs text-slate-400 font-mono">Parsing structural context abstractions...</p>
              </div>
            )}

            {auditResult && (
              <div className="flex-1 flex flex-col space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                    <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Safety Index</span>
                    <span className={`text-2xl font-black ${auditResult.security_score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {auditResult.security_score}/100
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                    <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Critical Bugs</span>
                    <span className={`text-2xl font-black ${auditResult.critical_bugs > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {auditResult.critical_bugs}
                    </span>
                  </div>
                </div>

                <div className="flex-1 bg-slate-9