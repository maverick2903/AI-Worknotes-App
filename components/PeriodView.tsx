
import React from 'react';
import type { JournalData, Note } from '../types';
import { groupNotesByPeriod, getMoodEmoji } from '../utils/helpers';

const PeriodCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-[#1C1C1C] border-2 border-[#3A3A3A] p-6 transition-all duration-200 ease-in-out hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_rgba(255,229,0,0.3)] hover:border-[#5A5A5A]">
        {children}
    </div>
);

interface PeriodViewProps {
  journalData: JournalData;
  period: 'weekly' | 'monthly';
}

export const PeriodView: React.FC<PeriodViewProps> = ({ journalData, period }) => {
  const groupedNotes = groupNotesByPeriod(journalData.notes, period);
  const sortedKeys = Object.keys(groupedNotes).sort((a, b) => b.localeCompare(a)).slice(0, period === 'weekly' ? 8 : 6);

  const summaries = period === 'weekly' ? journalData.weeklySummaries : journalData.monthlySummaries;

  return (
    <div className="animate-fadeIn">
        <div className="bg-[#1C1C1C] border-2 border-[#3A3A3A] p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
                <span className="w-1 h-6 bg-[#00B4FF]"></span>
                {period === 'weekly' ? 'Weekly Overview' : 'Monthly Overview'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedKeys.length > 0 ? sortedKeys.map(key => {
                    const entries = groupedNotes[key];
                    const moodCounts = entries.reduce((acc, { note }) => {
                        if (note.mood) acc[note.mood] = (acc[note.mood] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>);

                    const dominantMood = Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0];
                    
                    const title = period === 'weekly' 
                        ? key 
                        : new Date(key + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                    return (
                        <PeriodCard key={key}>
                            <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-[#3A3A3A]">
                                <h3 className="font-semibold text-[#FFE500] font-mono text-lg">{title}</h3>
                                <div className="flex gap-4 text-sm text-[#B4B4B4]">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium uppercase text-xs">Entries:</span>
                                        <span className="font-mono text-[#00FF88]">{entries.length}</span>
                                    </div>
                                    {dominantMood && period === 'weekly' && (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium uppercase text-xs">Mood:</span>
                                            <span className="font-mono text-[#00FF88]">{getMoodEmoji(dominantMood[0])} {dominantMood[0]}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-[#B4B4B4] text-sm leading-relaxed">
                                {summaries[key] || `${entries.length} entries recorded.`}
                            </p>
                        </PeriodCard>
                    );
                }) : <p className="p-8 text-center text-[#6B6B6B] md:col-span-2">Not enough data for a {period} view.</p>}
            </div>
        </div>
    </div>
  );
};
