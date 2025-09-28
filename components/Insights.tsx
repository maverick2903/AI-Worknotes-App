
import React, { useState } from 'react';
import type { GithubConfig } from '../types';

// FIX: Removed geminiApiKey and onGeminiApiKeyChange from props as API key is now handled by environment variables.
interface InsightsProps {
  onGenerateInsights: (type: 'comprehensive' | 'mood' | 'productivity' | 'tech') => Promise<string | null>;
  githubConfig: GithubConfig;
  onGithubConfigChange: (config: GithubConfig) => void;
  onSaveSettings: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const InsightBox: React.FC<{ children: React.ReactNode; title: string, borderColor?: string }> = ({ children, title, borderColor="border-[#3A3A3A]" }) => (
    <div className={`bg-[#1C1C1C] border-2 ${borderColor} p-8 transition-all duration-200 ease-in-out hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(255,229,0,0.5)] hover:border-[#5A5A5A]`}>
        <h3 className="text-xl font-bold mb-6 flex items-center gap-4 uppercase tracking-wider">
            <span className={`w-1 h-5 ${borderColor === 'border-[#9945FF]' ? 'bg-[#9945FF]' : borderColor === 'border-[#00B4FF]' ? 'bg-[#00B4FF]' : borderColor === 'border-[#00FF88]' ? 'bg-[#00FF88]' : 'bg-[#FF0099]'}`}></span>
            {title}
        </h3>
        <div className="prose prose-invert text-[#B4B4B4] max-w-none" dangerouslySetInnerHTML={{ __html: children as string }} />
    </div>
);

export const Insights: React.FC<InsightsProps> = ({ onGenerateInsights, githubConfig, onGithubConfigChange, onSaveSettings, onExport, onImport }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [insightsContent, setInsightsContent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const handleGenerate = async (type: 'comprehensive' | 'mood' | 'productivity' | 'tech') => {
        setIsLoading(true);
        setInsightsContent(null);
        setError(null);
        try {
            const result = await onGenerateInsights(type);
            setInsightsContent(result);
        } catch (e) {
            if (e instanceof Error) setError(e.message);
            else setError("An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const importRef = React.useRef<HTMLInputElement>(null);

    return (
        <div className="animate-fadeIn space-y-8">
            <details className="bg-[#141414] border-2 border-[#3A3A3A] p-6 open:pb-6 transition-all">
                <summary className="cursor-pointer font-semibold text-lg uppercase tracking-wider text-[#B4B4B4] list-none flex items-center gap-2 [&::-webkit-details-marker]:hidden">
                    <span className="transition-transform duration-200 transform details-arrow">▶</span>
                    Configuration & Data
                </summary>
                {/* FIX: Removed grid layout and Gemini API key input to align with API key handling guidelines. */}
                <div className="mt-6">
                    <div>
                        <h3 className="font-bold text-white mb-2">GitHub Settings</h3>
                        <p className="text-sm text-[#6B6B6B] mb-4">Your journal is stored in a `notes.json` file in a GitHub repo.</p>
                        <div className="space-y-4">
                            <input type="password" placeholder="GitHub Token" value={githubConfig.token} onChange={e => onGithubConfigChange({...githubConfig, token: e.target.value})} className="input-field" />
                            <input type="text" placeholder="Owner (e.g., 'your-username')" value={githubConfig.owner} onChange={e => onGithubConfigChange({...githubConfig, owner: e.target.value})} className="input-field" />
                            <input type="text" placeholder="Repo Name" value={githubConfig.repo} onChange={e => onGithubConfigChange({...githubConfig, repo: e.target.value})} className="input-field" />
                        </div>
                    </div>
                </div>
                <div className="mt-6 border-t-2 border-[#3A3A3A] pt-6 flex gap-4 flex-wrap">
                    <button onClick={onSaveSettings} className="btn-primary">Load/Save Settings</button>
                    <button onClick={onExport} className="btn-secondary">Export Data</button>
                    <button onClick={() => importRef.current?.click()} className="btn-secondary">Import Data</button>
                    <input type="file" ref={importRef} accept=".json" style={{ display: 'none' }} onChange={onImport} />
                </div>
            </details>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <button onClick={() => handleGenerate('comprehensive')} className="btn-primary w-full justify-center">Full Analysis</button>
                <button onClick={() => handleGenerate('mood')} className="btn-accent-pink w-full justify-center">Mood Trends</button>
                <button onClick={() => handleGenerate('productivity')} className="btn-accent-green w-full justify-center">Productivity</button>
                <button onClick={() => handleGenerate('tech')} className="btn-secondary w-full justify-center">Tech Stack</button>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center p-12 text-[#B4B4B4] font-mono">
                    <div className="w-5 h-5 border-2 border-[#FFE500] border-t-transparent rounded-full animate-spin mr-4"></div>
                    Processing your data...
                </div>
            )}
            
            {error && <InsightBox title="Analysis Error" borderColor="border-[#FF0099]">{error}</InsightBox>}
            {insightsContent && <div className="space-y-8" dangerouslySetInnerHTML={{ __html: insightsContent }} />}
        </div>
    );
};

// Add this to your index.html style block for the details arrow
/*
details[open] .details-arrow {
  transform: rotate(90deg);
}
*/
