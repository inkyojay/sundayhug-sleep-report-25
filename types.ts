
export interface FeedbackItem {
  id: number;
  x: number;
  y: number;
  title: string;
  feedback: string;
  riskLevel: 'High' | 'Medium' | 'Low' | 'Info';
}

export interface AnalysisReport {
  summary: string;
  feedbackItems: FeedbackItem[];
  references: {
    title: string;
    uri: string;
  }[];
}
