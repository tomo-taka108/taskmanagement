package com.example.taskmanagement.controller;

import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.service.CardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
