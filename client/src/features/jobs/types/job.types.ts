export type JobStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

export interface Job {
  id: string;
  userId: string | null;
  status: JobStatus;
  originalUrl: string;
  results: string[] | null;
  settings?: Record<string, unknown> | null;
  batchId?: string | null;
  createdAt: string;
}

export interface BatchJobItem {
  id: string;
  status: string;
}

export interface BatchCreateResult {
  batchId: string;
  jobs: BatchJobItem[];
}
