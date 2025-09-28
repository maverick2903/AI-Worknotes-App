
import type { Note } from '../types';

export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getMoodEmoji = (mood?: string): string => {
  if (!mood) return '🤔';
  const moodEmojis: Record<string, string> = {
    'Energetic': '⚡',
    'Focused': '🎯',
    'Stressed': '😰',
    'Frustrated': '😤',
    'Accomplished': '🎉',
    'Neutral': '😐',
    'Tired': '😴',
    'Excited': '🚀',
    'Anxious': '😟',
    'Confident': '💪',
    'Great': '😊',
    'Okay': '😐',
    'Tough': '😔',
  };
  return moodEmojis[mood] || '🤔';
};

export const getWeekKey = (date: Date): string => {
  const year = date.getFullYear();
  const firstDay = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + firstDay.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
};

export const groupNotesByPeriod = (notes: Record<string, Note>, period: 'weekly' | 'monthly'): Record<string, { date: string; note: Note }[]> => {
    return Object.entries(notes).reduce((acc, [date, note]) => {
        let key: string;
        if (period === 'weekly') {
            key = getWeekKey(new Date(date));
        } else {
            key = date.substring(0, 7); // YYYY-MM
        }
        if (!acc[key]) acc[key] = [];
        acc[key].push({ date, note });
        return acc;
    }, {} as Record<string, { date: string; note: Note }[]>);
};
