package com.example.taskmanagement.dto;

import com.example.taskmanagement.entity.BoardColumn;
import lombok.Getter;

import java.util.List;

@Getter
public class BoardColumnResponse {
	private final Long id;
	private final String title;
	private final Integer position;
	private final List<CardResponse> cards;

	public BoardColumnResponse(BoardColumn column) {
		this.id = column.getId();
		this.title = column.getTitle();
		this.position = column.getPosition();
		this.cards = column.getCards().stream().sorted((a, b) -> a.getPosition().compareTo(b.getPosition()))
				.map(CardResponse::new).toList();
	}
}
