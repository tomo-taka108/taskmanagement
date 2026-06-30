package com.example.taskmanagement.repository;

import com.example.taskmanagement.entity.BoardColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardColumnRepository extends JpaRepository<BoardColumn, Long> {
	List<BoardColumn> findAllByOrderByPositionAsc();
}
