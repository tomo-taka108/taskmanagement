package com.example.taskmanagement.controller;

import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.dto.LabelResponse;
import com.example.taskmanagement.service.LabelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LabelController {

	private final LabelService labelService;

	@GetMapping("/labels")
	public List<LabelResponse> getLabels() {
		return labelService.findAll();
	}

	@PostMapping("/cards/{cardId}/labels/{labelId}")
	@ResponseStatus(HttpStatus.CREATED)
	public CardResponse addLabelToCard(@PathVariable Long cardId, @PathVariable Long labelId) {
		return labelService.addLabelToCard(cardId, labelId);
	}

	@DeleteMapping("/cards/{cardId}/labels/{labelId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void removeLabelFromCard(@PathVariable Long cardId, @PathVariable Long labelId) {
		labelService.removeLabelFromCard(cardId, labelId);
	}
}
