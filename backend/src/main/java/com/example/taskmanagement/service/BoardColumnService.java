package com.example.taskmanagement.service;

import com.example.taskmanagement.dto.BoardColumnResponse;
import com.example.taskmanagement.entity.BoardColumn;
import com.example.taskmanagement.repository.BoardColumnRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardColumnService {

	private final BoardColumnRepository boardColumnRepository;

	public List<BoardColumnResponse> findAll() {
		return boardColumnRepository.findAllByOrderByPositionAsc().stream().map(BoardColumnResponse::new).toList();
	}

	public BoardColumnResponse findById(Long id) {
		BoardColumn column = boardColumnRepository.findById(id)
				.orElseThrow(() -> new NoSuchElementException("Column not found: " + id));
		return new BoardColumnResponse(column);
	}
}
