package com.example.taskmanagement.controller;

import com.example.taskmanagement.dto.ChecklistItemResponse;
import com.example.taskmanagement.dto.CreateChecklistItemRequest;
import com.example.taskmanagement.dto.UpdateChecklistItemRequest;
import com.example.taskmanagement.service.ChecklistItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ChecklistItemController {

	private final ChecklistItemService checklistItemService;

	@PostMapping("/cards/{cardId}/checklist-items")
	@ResponseStatus(HttpStatus.CREATED)
	public ChecklistItemResponse createChecklistItem(@PathVariable Long cardId,
			@Valid @RequestBody CreateChecklistItemRequest request) {
		return checklistItemService.create(cardId, request);
	}

	@PatchMapping("/checklist-items/{itemId}")
	public ChecklistItemResponse updateChecklistItem(@PathVariable Long itemId,
			@Valid @RequestBody UpdateChecklistItemRequest request) {
		return checklistItemService.update(itemId, request);
	}

	@DeleteMapping("/checklist-items/{itemId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteChecklistItem(@PathVariable Long itemId) {
		checklistItemService.delete(itemId);
	}
}
