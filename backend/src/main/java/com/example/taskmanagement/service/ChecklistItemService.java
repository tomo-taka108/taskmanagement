package com.example.taskmanagement.service;

import com.example.taskmanagement.dto.ChecklistItemResponse;
import com.example.taskmanagement.dto.CreateChecklistItemRequest;
import com.example.taskmanagement.dto.UpdateChecklistItemRequest;
import com.example.taskmanagement.entity.Card;
import com.example.taskmanagement.entity.ChecklistItem;
import com.example.taskmanagement.repository.CardRepository;
import com.example.taskmanagement.repository.ChecklistItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChecklistItemService {

	private final ChecklistItemRepository checklistItemRepository;
	private final CardRepository cardRepository;

	@Transactional
	public ChecklistItemResponse create(Long cardId, CreateChecklistItemRequest request) {
		Card card = cardRepository.findById(cardId)
				.orElseThrow(() -> new NoSuchElementException("Card not found: " + cardId));

		int nextPosition = checklistItemRepository.findByCardIdOrderByPositionAsc(cardId).stream()
				.mapToInt(ChecklistItem::getPosition).max().orElse(0) + 1;

		ChecklistItem item = ChecklistItem.builder().card(card).text(request.getText()).position(nextPosition).build();

		return new ChecklistItemResponse(checklistItemRepository.save(item));
	}

	@Transactional
	public ChecklistItemResponse update(Long itemId, UpdateChecklistItemRequest request) {
		ChecklistItem item = checklistItemRepository.findById(itemId)
				.orElseThrow(() -> new NoSuchElementException("ChecklistItem not found: " + itemId));

		if (request.getText() != null) {
			item.setText(request.getText());
		}
		if (request.getCompleted() != null) {
			item.setCompleted(request.getCompleted());
		}

		return new ChecklistItemResponse(checklistItemRepository.save(item));
	}

	@Transactional
	public void delete(Long itemId) {
		ChecklistItem item = checklistItemRepository.findById(itemId)
				.orElseThrow(() -> new NoSuchElementException("ChecklistItem not found: " + itemId));
		checklistItemRepository.delete(item);
	}
}
