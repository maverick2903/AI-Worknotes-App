
import type { GithubConfig, JournalData } from '../types';

const GITHUB_API_URL = 'https://api.github.com';

interface FetchResponse {
  content: string;
  sha: string;
}

export const fetchJournalData = async (config: GithubConfig): Promise<{ data: JournalData; sha: string }> => {
  const { owner, repo, path, branch, token } = config;
  const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (response.status === 404) {
      // File doesn't exist, return default structure and no sha
      const defaultData: JournalData = {
        notes: {},
        weeklySummaries: {},
        monthlySummaries: {},
        moodHistory: {},
        techStack: {},
        insights: { lastGenerated: null, comprehensive: null, mood: null, productivity: null, techStack: null },
      };
      return { data: defaultData, sha: '' };
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`GitHub API error: ${errorData.message || response.statusText}`);
    }

    const { content, sha }: FetchResponse = await response.json();
    // Decode base64 content safely as UTF-8
    const binary = atob(content);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decodedContent = new TextDecoder().decode(bytes);
    const data: JournalData = JSON.parse(decodedContent);
    return { data, sha };
  } catch (error) {
    console.error("Failed to fetch from GitHub:", error);
    throw error;
  }
};

interface UpdateParams extends GithubConfig {
  data: JournalData;
  sha: string;
  message: string;
}

export const updateJournalData = async (params: UpdateParams): Promise<{ sha: string }> => {
  const { owner, repo, path, branch, token, data, sha, message } = params;
  const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`;

  // Encode JSON content safely as UTF-8 base64
  const jsonString = JSON.stringify(data, null, 2);
  const utf8Bytes = new TextEncoder().encode(jsonString);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const content = btoa(binary);

  const body: { message: string; content: string; branch: string; sha?: string } = {
    message,
    content,
    branch,
  };
  
  if (sha) {
    body.sha = sha;
  }

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`GitHub API error: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    return { sha: result.content.sha };
  } catch (error) {
    console.error("Failed to update on GitHub:", error);
    throw error;
  }
};
