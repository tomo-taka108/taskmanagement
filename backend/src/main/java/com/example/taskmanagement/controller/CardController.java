package com.example.taskmanagement.controller;

import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.dto.CreateCardRequest;
import com.example.taskmanagement.dto.MoveCardRequest;
import com.example.taskmanagement.dto.UpdateCardRequest;
import com.example.taskmanagement.service.CardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CardController {

	private final CardService cardService;

	@GetMapping("/columns/{columnId}/cards")
	public List<CardResponse> getCardsByColumn(@PathVariable Long columnId) {
		return cardService.findByColumnId(columnId);
	}

	@GetMapping("/cards/{id}")
	public CardResponse getCard(@PathVariable Long id) {
		return cardService.findById(id);
	}

	@PostMapping("/columns/{columnId}/cards")
	@ResponseStatus(HttpStatus.CREATED)
	public CardResponse createCard(@PathVariable Long columnId, @Valid @RequestBody CreateCardRequest request) {
		return cardService.create(columnId, request);
	}

	@PatchMapping("/cards/{id}")
	public CardResponse updateCard(@PathVariable Long id, @Valid @RequestBody UpdateCardRequest request) {
		return cardService.update(id, request);
	}

	@PatchMapping("/cards/{id}/move")
	public CardResponse moveCard(@PathVariable Long id, @Valid @RequestBody MoveCardRequest request) {
		return cardService.move(id, request);
	}

	@DeleteMapping("/cards/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteCard(@PathVariable Long id) {
		cardService.delete(id);
	}
}
