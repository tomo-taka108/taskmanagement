package com.example.taskmanagement.controller;

import com.example.taskmanagement.dto.BoardColumnResponse;
import com.example.taskmanagement.service.BoardColumnService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
