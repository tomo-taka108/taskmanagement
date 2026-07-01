package com.example.taskmanagement.service;

import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.dto.LabelResponse;
import com.example.taskmanagement.entity.Card;
import com.example.taskmanagement.entity.Label;
import com.example.taskmanagement.repository.CardRepository;
import com.example.taskmanagement.repository.LabelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LabelService {

	private final LabelRepository labelRepository;
	private final CardRepository cardRepository;

	public List<LabelResponse> findAll() {
		return labelRepository.findAll().stream().map(LabelResponse::new).toList();
	}

	@Transactional
	public CardResponse addLabelToCard(Long cardId, Long labelId) {
		Card card = cardRepository.findById(cardId)
				.orElseThrow(() -> new NoSuchElementException("Card not found: " + cardId));
		Label label = labelRepository.findById(labelId)
				.orElseThrow(() -> new NoSuchElementException("Label not found: " + labelId));

		card.getLabels().add(label);
		return new CardResponse(cardRepository.save(card));
	}

	@Transactional
	public CardResponse removeLabelFromCard(Long cardId, Long labelId) {
		Card card = cardRepository.findById(cardId)
				.orElseThrow(() -> new NoSuchElementException("Card not found: " + cardId));
		Label label = labelRepository.findById(labelId)
				.orElseThrow(() -> new NoSuchElementException("Label not found: " + labelId));

		card.getLabels().remove(label);
		return new CardResponse(cardRepository.save(card));
	}
}
