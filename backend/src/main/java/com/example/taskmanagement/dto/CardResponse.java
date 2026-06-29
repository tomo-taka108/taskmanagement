package com.example.taskmanagement.dto;

import com.example.taskmanagement.entity.Card;
import com.example.taskmanagement.entity.Priority;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
public class CardResponse {
	private final Long id;
	private final Long columnId;
	private final String title;
	private final String description;
	private final LocalDate dueDate;
	private final Priority priority;
	private final String color;
	private final Integer position;
	private final List<ChecklistItemResponse> checklistItems;
	private final List<LabelResponse> labels;

	public CardResponse(Card card) {
		this.id = card.getId();
		this.columnId = card.getColumn().getId();
		this.title = card.getTitle();
		this.description = card.getDescription();
		this.dueDate = card.getDueDate();
		this.priority = card.getPriority();
		this.color = card.getColor();
		this.position = card.getPosition();
		this.checklistItems = card.getChecklistItems().stream().map(ChecklistItemResponse::new).toList();
		this.labels = card.getLabels().stream().map(LabelResponse::new).toList();
	}
}
