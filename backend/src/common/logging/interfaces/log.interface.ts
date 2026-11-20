export interface RequestLogEntry {
  timestamp: string;
  request_id: string;
  method: string;
  path: string;
  status_code: number;
  duration_ms: number;
  aborted: boolean;
}
