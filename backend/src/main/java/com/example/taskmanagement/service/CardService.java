package com.example.taskmanagement.service;

import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.dto.CreateCardRequest;
import com.example.taskmanagement.entity.BoardColumn;
import com.example.taskmanagement.entity.Card;
import com.example.taskmanagement.repository.BoardColumnRepository;
import com.example.taskmanagement.repository.CardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CardService {

    private final CardRepository cardRepository;
    private final BoardColumnRepository boardColumnRepository;

    public List<CardResponse> findByColumnId(Long columnId) {
        return cardRepository.findByColumnIdOrderByPositionAsc(columnId).stream()
                .map(CardResponse::new)
                .toList();
    }

    public CardResponse findById(Long id) {
        Card card = cardRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Card not found: " + id));
        return new CardResponse(card);
    }

    @Transactional
    public CardResponse create(Long columnId, CreateCardRequest request) {
        BoardColumn column = boardColumnRepository.findById(columnId)
                .orElseThrow(() -> new NoSuchElementException("Column not found: " + columnId));

        int nextPosition = cardRepository.findMaxPositionByColumnId(columnId)
                .map(max -> max + 1)
                .orElse(1);

        Card card = Card.builder()
                .column(column)
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .dueDate(request.getDueDate())
                .position(nextPosition)
                .build();

        return new CardResponse(cardRepository.save(card));
    }
}
