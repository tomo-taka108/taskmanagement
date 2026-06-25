export interface LabelResponse {
  id: number;
  name: string;
  color: string;
}

export interface ChecklistItemResponse {
  id: number;
  text: string;
  completed: boolean;
  position: number;
}

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface CardResponse {
  id: number;
  columnId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: Priority | null;
  color: string | null;
  position: number;
  checklistItems: ChecklistItemResponse[];
  labels: LabelResponse[];
}

export interface BoardColumnResponse {
  id: number;
  title: string;
  position: number;
  cards: CardResponse[];
}

export interface CreateCardRequest {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
}

export type DueFilter = '' | 'overdue' | 'this-week';

export interface FilterState {
  keyword: string;
  labelId: string;
  due: DueFilter;
}
