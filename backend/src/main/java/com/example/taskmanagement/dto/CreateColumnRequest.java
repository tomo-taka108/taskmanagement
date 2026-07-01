package com.example.taskmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class CreateColumnRequest {

	@NotBlank
	private String title;
}
