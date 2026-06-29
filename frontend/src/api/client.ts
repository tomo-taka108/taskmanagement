import axios from 'axios';
import type { BoardColumnResponse, CardResponse, CreateCardRequest, MoveCardRequest, UpdateCardRequest } from '../types/api';

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
