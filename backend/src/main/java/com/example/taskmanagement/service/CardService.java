package com.example.taskmanagement.service;

import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.dto.CreateCardRequest;
import com.example.taskmanagement.dto.MoveCardRequest;
import com.example.taskmanagement.dto.UpdateCardRequest;
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

    @Transactional
    public CardResponse update(Long id, UpdateCardRequest request) {
        Card card = cardRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Card not found: " + id));

        if (request.getTitle() != null) card.setTitle(request.getTitle());
        if (request.getDescription() != null) card.setDescription(request.getDescription());
        if (request.getPriority() != null) card.setPriority(request.getPriority());
        if (request.getDueDate() != null) card.setDueDate(request.getDueDate());

        return new CardResponse(cardRepository.save(card));
    }

    @Transactional
    public void delete(Long id) {
        Card card = cardRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Card not found: " + id));
        cardRepository.shiftPositionsDown(card.getColumn().getId(), card.getPosition());
        cardRepository.delete(card);
    }

    @Transactional
    public CardResponse move(Long id, MoveCardRequest request) {
        Card card = cardRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Card not found: " + id));

        Long sourceColumnId = card.getColumn().getId();
        Long targetColumnId = request.getTargetColumnId();
        int newPosition = request.getNewPosition();

        // 元の位置より後ろをつめる
        cardRepository.shiftPositionsDown(sourceColumnId, card.getPosition());

        if (!sourceColumnId.equals(targetColumnId)) {
            BoardColumn targetColumn = boardColumnRepository.findById(targetColumnId)
                    .orElseThrow(() -> new NoSuchElementException("Column not found: " + targetColumnId));
            card.setColumn(targetColumn);
        }

        // 挿入位置より後ろをずらす
        cardRepository.shiftPositionsUp(targetColumnId, newPosition);

        card.setPosition(newPosition);
        return new CardResponse(cardRepository.save(card));
    }
}
