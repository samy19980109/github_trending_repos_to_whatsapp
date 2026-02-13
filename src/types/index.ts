export interface TrendingRepo {
  fullName: string;
  author: string;
  name: string;
  url: string;
  description: string;
  language: string;
  stars: number;
  starsToday: number;
  rank: number;
}

export interface SentRepo {
  fullName: string;
  stars: number;
  starsToday: number;
  sentAt: string;
  rank: number;
}

export interface SentReposData {
  lastCheck: string;
  sentRepositories: SentRepo[];
}

export interface Config {
  whatsapp: {
    phoneNumber: string;
    groupName: string;
    markOnlineOnConnect: boolean;
    messageDelay: number;
  };
  github: {
    apiUrl: string;
    topN: number;
    language: string;
    since: string;
  };
  storage: {
    sentReposFile: string;
    authDir: string;
    logFile: string;
  };
}
