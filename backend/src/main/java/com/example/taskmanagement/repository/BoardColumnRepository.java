package com.example.taskmanagement.repository;

import com.example.taskmanagement.entity.BoardColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BoardColumnRepository extends JpaRepository<BoardColumn, Long> {
	List<BoardColumn> findAllByOrderByPositionAsc();

	@Query("SELECT MAX(c.position) FROM BoardColumn c")
	Optional<Integer> findMaxPosition();

	@Modifying
	@Query("UPDATE BoardColumn c SET c.position = c.position - 1 WHERE c.position > :position")
	void shiftPositionsDown(@Param("position") int position);
}
