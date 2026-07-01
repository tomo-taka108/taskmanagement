package com.example.taskmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class UpdateColumnRequest {

	@NotBlank
	private String title;
}
