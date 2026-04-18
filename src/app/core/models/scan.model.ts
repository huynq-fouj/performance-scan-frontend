export interface ScanRecord {
  id: string;
  projectId: string;
  status: 'queued' | 'running' | 'success' | 'failed';
  performanceScore?: number;
  accessibilityScore?: number;
  bestPracticesScore?: number;
  seoScore?: number;

  // Core Web Vitals
  fcp?: number;
  lcp?: number;
  cls?: number;
  tbt?: number;
  inp?: number;
  speedIndex?: number;

  // Asset metrics
  jsSizeKb?: number;
  cssSizeKb?: number;
  requestCount?: number;

  screenshotUrl?: string;
  recommendations: string[];
  errorMessage?: string;

  startedAt?: string | Date;
  completedAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateScanRequest {
  projectId: string;
}
