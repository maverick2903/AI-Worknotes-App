
import React, { useState, useEffect } from 'react';
import type { JournalData, Note } from '../types';
import { getTodayDateString, formatDate, getMoodEmoji } from '../utils/helpers';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-[#1C1C1C] border-2 border-[#3A3A3A] p-8 mb-8 relative transition-all duration-200 ease-in-out hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(255,229,0,0.5)] hover:border-[#5A5A5A] ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
    <span className="w-1 h-6 bg-[#FF0099]"></span>
    {children}
  </h2>
);

interface DailyLogProps {
  journalData: JournalData;
  onSaveNote: (date: string, content: string, mood?: string) => void;
  onDetectMood: (content: string) => Promise<string | null>;
  onQuickAnalysis: (content: string) => Promise<string | null>;
}

export const DailyLog: React.FC<DailyLogProps> = ({ journalData, onSaveNote, onDetectMood, onQuickAnalysis }) => {
  const [currentDate, setCurrentDate] = useState(getTodayDateString());
  const [noteContent, setNoteContent] = useState('');
  const [quickInsight, setQuickInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const note = journalData.notes[currentDate];
    setNoteContent(note ? note.content : '');
  }, [currentDate, journalData.notes]);

  const handleSave = () => {
    onSaveNote(currentDate, noteContent);
  };

  const handleDetectMood = async () => {
    if (noteContent.length < 30) {
      alert('Please write at least 30 characters for an accurate mood detection.');
      return;
    }
    const mood = await onDetectMood(noteContent);
    if (mood) {
      onSaveNote(currentDate, noteContent, mood);
    }
  };
  
  const handleQuickAnalysis = async () => {
    if (noteContent.length < 50) {
        alert('Please write at least 50 characters for analysis.');
        return;
    }
    setIsAnalyzing(true);
    setQuickInsight(null);
    const result = await onQuickAnalysis(noteContent);
    setQuickInsight(result);
    setIsAnalyzing(false);
  }

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the current entry?')) {
      setNoteContent('');
    }
  };
  
  const handleSelectNote = (date: string) => {
    setCurrentDate(date);
  };

  const sortedNotes = Object.entries(journalData.notes).sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
      <Card>
        <CardTitle>Log Entry</CardTitle>
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="bg-[#141414] text-white border-2 border-[#3A3A3A] p-3 text-base font-mono transition-all duration-200 focus:outline-none focus:border-[#FFE500] focus:shadow-[0_0_0_3px_rgba(255,229,0,0.1)]"
          />
          <button onClick={() => setCurrentDate(getTodayDateString())} className="btn-secondary">Today</button>
          <button onClick={handleDetectMood} className="btn-accent-green">Detect Mood</button>
        </div>
        <textarea
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          className="w-full min-h-[350px] p-6 border-2 border-[#3A3A3A] text-base leading-relaxed resize-y bg-[#141414] text-white font-primary transition-all duration-200 focus:outline-none focus:border-[#FFE500] focus:shadow-[0_0_0_3px_rgba(255,229,0,0.1)] placeholder:text-[#6B6B6B]"
          placeholder="Document your day: tasks completed, challenges faced, thoughts, achievements, tech stack used, meetings, learnings..."
        />
        <div className="mt-6 flex gap-3 flex-wrap">
          <button onClick={handleSave} className="btn-primary">Save Entry</button>
          <button onClick={handleQuickAnalysis} className="btn-secondary">Quick Analysis</button>
          <button onClick={handleClear} className="btn-secondary">Clear</button>
        </div>
        {isAnalyzing && <div className="mt-6 text-center text-[#B4B4B4]">Analyzing...</div>}
        {quickInsight && (
            <div className="mt-6 border-t-2 border-[#3A3A3A] pt-4 text-[#B4B4B4]" dangerouslySetInnerHTML={{ __html: quickInsight }} />
        )}
      </Card>
      
      <Card>
        <CardTitle>Recent Entries</CardTitle>
        <div className="notes-list max-h-[500px] overflow-y-auto border-2 border-[#3A3A3A] bg-[#141414]">
          {sortedNotes.length > 0 ? (
            // FIX: Explicitly type the 'note' object to resolve type inference issue with Object.entries.
            sortedNotes.slice(0, 20).map(([date, note]: [string, Note]) => (
              <div
                key={date}
                onClick={() => handleSelectNote(date)}
                className="p-6 border-b-2 border-[#3A3A3A] cursor-pointer transition-all duration-200 relative hover:bg-[#1C1C1C] hover:pl-8"
              >
                <div className="font-semibold text-[#00FF88] mb-2 font-mono text-sm flex items-center gap-4 flex-wrap">
                  {formatDate(date)}
                  {note.mood && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#0A0A0A] border border-[#3A3A3A] text-xs font-medium">
                      <span className="text-base">{getMoodEmoji(note.mood)}</span>
                      <span>{note.mood}</span>
                    </span>
                  )}
                </div>
                <p className="text-[#B4B4B4] text-sm leading-normal truncate">
                  {note.content}
                </p>
              </div>
            ))
          ) : (
            <p className="p-8 text-center text-[#6B6B6B]">No entries yet. Start your journal!</p>
          )}
        </div>
      </Card>
    </div>
  );
};
