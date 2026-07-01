package com.example.taskmanagement.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;

import java.util.List;

@Getter
public class ReorderColumnsRequest {

	@NotEmpty
	private List<Long> columnIds;
}
