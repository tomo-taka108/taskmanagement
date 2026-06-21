import axios from 'axios';
import type { BoardColumnResponse } from '../types/api';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

export const fetchColumns = (): Promise<BoardColumnResponse[]> =>
  apiClient.get<BoardColumnResponse[]>('/api/columns').then((r) => r.data);
