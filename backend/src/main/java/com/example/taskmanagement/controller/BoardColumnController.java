package com.example.taskmanagement.controller;

import com.example.taskmanagement.dto.BoardColumnResponse;
import com.example.taskmanagement.dto.CreateColumnRequest;
import com.example.taskmanagement.dto.ReorderColumnsRequest;
import com.example.taskmanagement.dto.UpdateColumnRequest;
import com.example.taskmanagement.service.BoardColumnService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/columns")
@RequiredArgsConstructor
public class BoardColumnController {

	private final BoardColumnService boardColumnService;

	@GetMapping
	public List<BoardColumnResponse> getColumns() {
		return boardColumnService.findAll();
	}

	@GetMapping("/{id}")
	public BoardColumnResponse getColumn(@PathVariable Long id) {
		return boardColumnService.findById(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public BoardColumnResponse createColumn(@Valid @RequestBody CreateColumnRequest request) {
		return boardColumnService.create(request);
	}

	@PutMapping("/{id}")
	public BoardColumnResponse updateColumn(@PathVariable Long id, @Valid @RequestBody UpdateColumnRequest request) {
		return boardColumnService.update(id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteColumn(@PathVariable Long id) {
		boardColumnService.delete(id);
	}

	@PutMapping("/reorder")
	public List<BoardColumnResponse> reorderColumns(@Valid @RequestBody ReorderColumnsRequest request) {
		return boardColumnService.reorder(request);
	}
}
