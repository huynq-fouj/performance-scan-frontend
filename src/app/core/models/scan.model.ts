export interface ScanIssue {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  metric?: string;
  impact?: string;
}

export interface ScanRecommendation {
  title: string;
  expectedGain?: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface ThirdPartyDomain {
  domain: string;
  transferSizeKb: number;
}

export interface ScanRecord {
  id: string;
  projectId: string;
  status: 'queued' | 'running' | 'success' | 'failed';
  device?: 'mobile' | 'desktop';
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
  fcpScore?: number;
  lcpScore?: number;
  clsScore?: number;
  tbtScore?: number;
  speedIndexScore?: number;

  // Asset metrics
  jsSizeKb?: number;
  cssSizeKb?: number;
  imageSizeKb?: number;
  fontSizeKb?: number;
  otherSizeKb?: number;
  requestCount?: number;
  thirdPartyDomains?: ThirdPartyDomain[];

  screenshotUrl?: string;
  issues?: ScanIssue[];
  recommendations: ScanRecommendation[];
  errorMessage?: string;

  // Populated project info (for global scans list)
  project?: { id: string; name: string; url: string };

  startedAt?: string | Date;
  completedAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateScanRequest {
  projectId: string;
}
