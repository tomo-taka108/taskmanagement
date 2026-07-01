import axios from 'axios';
import type { BoardColumnResponse, CardResponse, ChecklistItemResponse, CreateCardRequest, CreateColumnRequest, LabelResponse, MoveCardRequest, ReorderColumnsRequest, UpdateCardRequest, UpdateColumnRequest } from '../types/api';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

export const fetchColumns = (): Promise<BoardColumnResponse[]> =>
  apiClient.get<BoardColumnResponse[]>('/api/columns').then((r) => r.data);

export const createCard = (
  columnId: number,
  data: CreateCardRequest
): Promise<CardResponse> =>
  apiClient.post<CardResponse>(`/api/columns/${columnId}/cards`, data).then((r) => r.data);

export const updateCard = (
  cardId: number,
  data: UpdateCardRequest
): Promise<CardResponse> =>
  apiClient.patch<CardResponse>(`/api/cards/${cardId}`, data).then((r) => r.data);

export const moveCard = (
  cardId: number,
  data: MoveCardRequest
): Promise<CardResponse> =>
  apiClient.patch<CardResponse>(`/api/cards/${cardId}/move`, data).then((r) => r.data);

export const deleteCard = (cardId: number): Promise<void> =>
  apiClient.delete(`/api/cards/${cardId}`).then(() => undefined);

export const createColumn = (data: CreateColumnRequest): Promise<BoardColumnResponse> =>
  apiClient.post<BoardColumnResponse>('/api/columns', data).then((r) => r.data);

export const updateColumn = (id: number, data: UpdateColumnRequest): Promise<BoardColumnResponse> =>
  apiClient.put<BoardColumnResponse>(`/api/columns/${id}`, data).then((r) => r.data);

export const deleteColumn = (id: number): Promise<void> =>
  apiClient.delete(`/api/columns/${id}`).then(() => undefined);

export const reorderColumns = (data: ReorderColumnsRequest): Promise<BoardColumnResponse[]> =>
  apiClient.put<BoardColumnResponse[]>('/api/columns/reorder', data).then((r) => r.data);

// Checklist API
export const createChecklistItem = (
  cardId: number,
  text: string
): Promise<ChecklistItemResponse> =>
  apiClient.post<ChecklistItemResponse>(`/api/cards/${cardId}/checklist-items`, { text }).then((r) => r.data);

export const updateChecklistItem = (
  itemId: number,
  data: { text?: string; completed?: boolean }
): Promise<ChecklistItemResponse> =>
  apiClient.patch<ChecklistItemResponse>(`/api/checklist-items/${itemId}`, data).then((r) => r.data);

export const deleteChecklistItem = (itemId: number): Promise<void> =>
  apiClient.delete(`/api/checklist-items/${itemId}`).then(() => undefined);

// Label API
export const fetchLabels = (): Promise<LabelResponse[]> =>
  apiClient.get<LabelResponse[]>('/api/labels').then((r) => r.data);

export const addLabelToCard = (cardId: number, labelId: number): Promise<CardResponse> =>
  apiClient.post<CardResponse>(`/api/cards/${cardId}/labels/${labelId}`).then((r) => r.data);

export const removeLabelFromCard = (cardId: number, labelId: number): Promise<void> =>
  apiClient.delete(`/api/cards/${cardId}/labels/${labelId}`).then(() => undefined);
