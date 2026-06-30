package com.example.taskmanagement.dto;

import com.example.taskmanagement.entity.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class CreateCardRequest {

	@NotBlank
	@Size(max = 255)
	private String title;

	private String description;

	private Priority priority;

	private LocalDate dueDate;
}
