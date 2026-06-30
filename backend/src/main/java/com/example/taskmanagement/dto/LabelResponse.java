package com.example.taskmanagement.dto;

import com.example.taskmanagement.entity.Label;
import lombok.Getter;

@Getter
public class LabelResponse {
	private final Long id;
	private final String name;
	private final String color;

	public LabelResponse(Label label) {
		this.id = label.getId();
		this.name = label.getName();
		this.color = label.getColor();
	}
}
