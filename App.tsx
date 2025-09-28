
import React, { useState, useCallback, useEffect } from 'react';
import type { TabName, JournalData, Note, SyncStatus, GithubConfig } from './types';
import { DailyLog } from './components/DailyLog';
import { PeriodView } from './components/PeriodView';
import { Insights } from './components/Insights';
import { Analytics } from './components/Analytics';
import { fetchJournalData, updateJournalData } from './services/githubService';
import { callGeminiAPI } from './services/geminiService';
import { getTodayDateString, getMoodEmoji } from './utils/helpers';

const TABS: { id: TabName; label: string }[] = [
    { id: 'daily', label: 'Daily Log' },
    { id: 'weekly', label: 'Weekly View' },
    { id: 'monthly', label: 'Monthly View' },
    { id: 'insights', label: 'AI Insights' },
    { id: 'analytics', label: 'Analytics' },
];

const emptyJournalData: JournalData = {
    notes: {}, weeklySummaries: {}, monthlySummaries: {}, moodHistory: {}, techStack: {},
    insights: { lastGenerated: null, comprehensive: null, mood: null, productivity: null, techStack: null },
};

const Header = () => (
    <header className="text-center mb-12 relative py-8 header-line">
        <h1 className="text-5xl font-bold mb-2 tracking-tighter text-gradient">
            Work Journal
        </h1>
        <p className="text-[#B4B4B4] text-lg font-mono">
            // Transform chaos into clarity
        </p>
    </header>
);

const Tabs: React.FC<{ activeTab: TabName; setActiveTab: (tab: TabName) => void }> = ({ activeTab, setActiveTab }) => (
    <nav className="flex gap-4 mb-8 flex-wrap">
        {TABS.map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-6 bg-[#1C1C1C] border-2 border-[#3A3A3A] text-[#B4B4B4] cursor-pointer font-semibold uppercase tracking-wider text-sm transition-all duration-200 ease-in-out relative overflow-hidden 
                hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_rgba(255,229,0,0.3)] hover:border-[#5A5A5A] 
                ${activeTab === tab.id ? 'bg-[#FFE500] text-[#0A0A0A] border-[#FFE500] shadow-[6px_6px_0px_rgba(255,229,0,0.5)]' : ''}`}
            >
                {tab.label}
            </button>
        ))}
    </nav>
);

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabName>('daily');
    const [journalData, setJournalData] = useState<JournalData>(emptyJournalData);
    const [fileSha, setFileSha] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>({ message: '', type: 'info', show: false });
    
    const [githubConfig, setGithubConfig] = useState<GithubConfig>({ token: '', owner: '', repo: '', path: 'notes.json', branch: 'notes'});
    // FIX: Removed Gemini API key state management to adhere to environment variable guidelines.
    
    useEffect(() => {
        const savedGithubConfig = localStorage.getItem('githubConfig');
        // FIX: Removed Gemini API key logic from local storage.
        if (savedGithubConfig) setGithubConfig(JSON.parse(savedGithubConfig));
    }, []);

    const showSyncStatus = (message: string, type: SyncStatus['type'] = 'success', duration = 3000) => {
        setSyncStatus({ message, type, show: true });
        setTimeout(() => setSyncStatus({ message: '', type, show: false }), duration);
    };

    const loadDataFromGithub = useCallback(async () => {
        if (!githubConfig.token || !githubConfig.owner || !githubConfig.repo) {
            showSyncStatus('GitHub settings are incomplete', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const { data, sha } = await fetchJournalData(githubConfig);
            setJournalData(data);
            setFileSha(sha);
            showSyncStatus('Data loaded from GitHub', 'success');
        } catch (error) {
            showSyncStatus(error instanceof Error ? error.message : 'Failed to load data', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [githubConfig]);
    
    const saveDataToGithub = useCallback(async (data: JournalData, message: string) => {
        if (!githubConfig.token || !githubConfig.owner || !githubConfig.repo) {
             showSyncStatus('GitHub settings are incomplete', 'error');
             return;
        }
        showSyncStatus('Syncing...', 'info');
        try {
            const { sha: newSha } = await updateJournalData({ ...githubConfig, data, sha: fileSha, message });
            setFileSha(newSha);
            showSyncStatus('Data synced to GitHub', 'success');
        } catch (error) {
            showSyncStatus(error instanceof Error ? error.message : 'Failed to sync data', 'error');
        }
    }, [githubConfig, fileSha]);

    const handleSaveNote = async (date: string, content: string, mood?: string) => {
        const newJournalData = { ...journalData };
        const existingNote = newJournalData.notes[date] || {};

        if (content.trim()) {
            const newNote: Note = {
                ...existingNote,
                content: content,
                timestamp: new Date().toISOString(),
                mood: mood || existingNote.mood
            };
            newJournalData.notes[date] = newNote;
            if (newNote.mood) {
                newJournalData.moodHistory[date] = newNote.mood;
            }
        } else {
            delete newJournalData.notes[date];
        }

        setJournalData(newJournalData);
        await saveDataToGithub(newJournalData, `docs: update journal for ${date}`);
    };
    
    const handleDetectMood = async (content: string): Promise<string | null> => {
        showSyncStatus('Detecting mood...', 'info');
        try {
            const prompt = `Analyze the mood of this work journal entry. Return ONLY one of these moods: Energetic, Focused, Stressed, Frustrated, Accomplished, Neutral, Tired, Excited, Anxious, Confident. Entry: ${content}`;
            // FIX: Removed geminiApiKey from callGeminiAPI call. API key is handled by environment variables.
            const mood = await callGeminiAPI(prompt, 10);
            const cleanMood = mood.trim();
            showSyncStatus(`Mood detected: ${cleanMood}`, 'success');
            return cleanMood;
        } catch (error) {
            showSyncStatus(error instanceof Error ? error.message : 'Mood detection failed', 'error');
            return null;
        }
    };
    
    const handleQuickAnalysis = async (content: string): Promise<string | null> => {
        try {
            const prompt = `Analyze this journal entry and provide 3 concise, actionable insights as an HTML list. 1. Immediate action. 2. Reflection. 3. Suggestion for tomorrow. Entry: ${content}`;
            // FIX: Removed geminiApiKey from callGeminiAPI call. API key is handled by environment variables.
            const result = await callGeminiAPI(prompt, 300);
            return result.replace(/\n/g, '<br>');
        } catch (error) {
            return `<p class="text-[#FF0099]">Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}</p>`;
        }
    };
    
    const formatInsightHTML = (text: string) => {
      return text
          .replace(/## (.*)/g, '<h3 class="text-xl font-bold mt-6 mb-3 text-white">$1</h3>')
          .replace(/\* \*(.*?)\* \*/g, '<strong>$1</strong>')
          .replace(/\* (.*)/g, '<li class="ml-4 list-disc">$1</li>')
          .replace(/\n/g, '<br>');
    };

    const handleGenerateInsights = async (type: 'comprehensive' | 'mood' | 'productivity' | 'tech'): Promise<string | null> => {
        if (Object.keys(journalData.notes).length < 3) {
            throw new Error('You need at least 3 entries for a full analysis.');
        }

        let prompt = '';
        // FIX: Explicitly type the 'note' object to resolve type inference issue with Object.entries.
        const recentEntries = Object.entries(journalData.notes).slice(-15).map(([date, note]: [string, Note]) => `${date}: ${note.content}`).join('\n\n');

        switch(type) {
            case 'comprehensive':
                prompt = `You are an executive coach. Analyze these journal entries and provide a comprehensive analysis with sections for "Executive Summary", "Key Accomplishments", "Critical Challenges", and "Strategic Recommendations". Use HTML for formatting. Entries:\n${recentEntries}`;
                break;
            case 'mood':
                const moodData = Object.entries(journalData.moodHistory).map(([date, mood]) => `${date}: ${mood}`).join('\n');
                prompt = `Analyze these mood patterns. Provide insights on trends, triggers, and recommendations for mood optimization. Use HTML for formatting. Mood data:\n${moodData}`;
                break;
            case 'productivity':
                prompt = `Analyze these entries for productivity patterns. Focus on high-productivity periods, common blockers, and suggestions for workflow optimization. Use HTML for formatting. Entries:\n${recentEntries}`;
                break;
            case 'tech':
                const techStack = Object.entries(journalData.techStack).map(([tech, count]) => `${tech} (${count})`).join(', ');
                prompt = `Analyze tech usage from these entries and this stack summary: ${techStack}. Assess current stack, identify trends, and recommend learning paths. Use HTML for formatting. Entries:\n${recentEntries}`;
                break;
        }

        try {
            // FIX: Removed geminiApiKey from callGeminiAPI call. API key is handled by environment variables.
            const result = await callGeminiAPI(prompt, 2048);
            return formatInsightHTML(result);
        } catch (error) {
            throw error;
        }
    };

    const handleSaveSettings = () => {
        localStorage.setItem('githubConfig', JSON.stringify(githubConfig));
        // FIX: Removed saving Gemini API key to local storage.
        showSyncStatus('Settings saved', 'success');
        loadDataFromGithub();
    };
    
    const handleExport = () => {
        const blob = new Blob([JSON.stringify(journalData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `work-journal-export-${getTodayDateString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showSyncStatus('Data exported', 'success');
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target?.result as string);
                setJournalData(importedData);
                saveDataToGithub(importedData, "docs: import journal data");
            } catch (error) {
                showSyncStatus('Import failed: Invalid file', 'error');
            }
        };
        reader.readAsText(file);
    };

    const renderContent = () => {
        if(isLoading) {
            return <div className="text-center p-16 text-[#B4B4B4]">Loading Data from GitHub...</div>;
        }
        switch (activeTab) {
            case 'daily': return <DailyLog journalData={journalData} onSaveNote={handleSaveNote} onDetectMood={handleDetectMood} onQuickAnalysis={handleQuickAnalysis} />;
            case 'weekly': return <PeriodView journalData={journalData} period="weekly" />;
            case 'monthly': return <PeriodView journalData={journalData} period="monthly" />;
            // FIX: Removed props related to Gemini API key management.
            case 'insights': return <Insights onGenerateInsights={handleGenerateInsights} githubConfig={githubConfig} onGithubConfigChange={setGithubConfig} onSaveSettings={handleSaveSettings} onExport={handleExport} onImport={handleImport} />;
            case 'analytics': return <Analytics />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen text-white font-primary overflow-x-hidden">
            {syncStatus.show && (
                <div className={`fixed top-5 right-5 p-3 px-6 border-2 font-mono uppercase text-xs z-50 animate-slideIn 
                    ${syncStatus.type === 'success' ? 'border-[#00FF88] text-[#00FF88] bg-[#0A0A0A]' : ''} 
                    ${syncStatus.type === 'error' ? 'border-[#FF0099] text-[#FF0099] bg-[#0A0A0A]' : ''} 
                    ${syncStatus.type === 'info' ? 'border-[#00B4FF] text-[#00B4FF] bg-[#0A0A0A]' : ''}`}>
                    {syncStatus.message}
                </div>
            )}
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Header />
                <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
                <main>
                    {renderContent()}
                </main>
            </div>
            
            <style jsx global>{`
              .btn-primary { background-color: #FFE500; color: #0A0A0A; border-color: #FFE500; padding: 0.75rem 1.5rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); display: inline-flex; align-items: center; gap: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; border-width: 2px; }
              .btn-primary:hover { transform: translate(-2px, -2px); box-shadow: 3px 3px 0px rgba(255, 229, 0, 0.3); }
              .btn-secondary { background-color: #1C1C1C; color: #FAFAFA; border-color: #3A3A3A; padding: 0.75rem 1.5rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); display: inline-flex; align-items: center; gap: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; border-width: 2px; }
              .btn-secondary:hover { transform: translate(-2px, -2px); box-shadow: 3px 3px 0px rgba(255, 229, 0, 0.3); }
              .btn-accent-green { background-color: #00FF88; color: #0A0A0A; border-color: #00FF88; padding: 0.75rem 1.5rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); display: inline-flex; align-items: center; gap: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; border-width: 2px; }
              .btn-accent-green:hover { transform: translate(-2px, -2px); box-shadow: 3px 3px 0px rgba(0, 255, 136, 0.3); }
               .btn-accent-pink { background-color: #FF0099; color: #FAFAFA; border-color: #FF0099; padding: 0.75rem 1.5rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); display: inline-flex; align-items: center; gap: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; border-width: 2px; }
              .btn-accent-pink:hover { transform: translate(-2px, -2px); box-shadow: 3px 3px 0px rgba(255, 0, 153, 0.3); }
              .input-field { width: 100%; padding: 0.75rem; border: 2px solid #3A3A3A; background-color: #0A0A0A; color: #FAFAFA; font-family: 'JetBrains Mono', monospace; }
              details[open] .details-arrow { transform: rotate(90deg); }
              .animate-slideIn { animation: slideIn 0.3s ease-in-out; }
            `}</style>
        </div>
    );
};

export default App;
