package com.example.taskmanagement.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateChecklistItemRequest {

	@Size(max = 500)
	private String text;

	private Boolean completed;
}
