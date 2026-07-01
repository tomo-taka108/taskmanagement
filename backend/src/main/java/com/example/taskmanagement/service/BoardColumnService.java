package com.example.taskmanagement.service;

import com.example.taskmanagement.dto.BoardColumnResponse;
import com.example.taskmanagement.dto.CreateColumnRequest;
import com.example.taskmanagement.dto.ReorderColumnsRequest;
import com.example.taskmanagement.dto.UpdateColumnRequest;
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

	@Transactional
	public BoardColumnResponse create(CreateColumnRequest request) {
		int nextPosition = boardColumnRepository.findMaxPosition().map(max -> max + 1).orElse(1);
		BoardColumn column = BoardColumn.builder().title(request.getTitle()).position(nextPosition).build();
		return new BoardColumnResponse(boardColumnRepository.save(column));
	}

	@Transactional
	public BoardColumnResponse update(Long id, UpdateColumnRequest request) {
		BoardColumn column = boardColumnRepository.findById(id)
				.orElseThrow(() -> new NoSuchElementException("Column not found: " + id));
		column.setTitle(request.getTitle());
		return new BoardColumnResponse(boardColumnRepository.save(column));
	}

	@Transactional
	public void delete(Long id) {
		BoardColumn column = boardColumnRepository.findById(id)
				.orElseThrow(() -> new NoSuchElementException("Column not found: " + id));
		int deletedPosition = column.getPosition();
		boardColumnRepository.delete(column);
		boardColumnRepository.shiftPositionsDown(deletedPosition);
	}

	@Transactional
	public List<BoardColumnResponse> reorder(ReorderColumnsRequest request) {
		List<Long> columnIds = request.getColumnIds();
		for (int i = 0; i < columnIds.size(); i++) {
			BoardColumn column = boardColumnRepository.findById(columnIds.get(i))
					.orElseThrow(() -> new NoSuchElementException("Column not found"));
			column.setPosition(i + 1);
			boardColumnRepository.save(column);
		}
		return boardColumnRepository.findAllByOrderByPositionAsc().stream().map(BoardColumnResponse::new).toList();
	}
}
