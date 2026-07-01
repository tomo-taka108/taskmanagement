package com.example.taskmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateChecklistItemRequest {

	@NotBlank(message = "text is required")
	@Size(max = 500)
	private String text;
}
