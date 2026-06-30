package com.example.taskmanagement.repository;

import com.example.taskmanagement.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CardRepository extends JpaRepository<Card, Long> {
	List<Card> findByColumnIdOrderByPositionAsc(Long columnId);

	@Query("SELECT MAX(c.position) FROM Card c WHERE c.column.id = :columnId")
	Optional<Integer> findMaxPositionByColumnId(@Param("columnId") Long columnId);

	@Modifying
	@Query("UPDATE Card c SET c.position = c.position - 1 WHERE c.column.id = :columnId AND c.position > :position")
	void shiftPositionsDown(@Param("columnId") Long columnId, @Param("position") int position);

	@Modifying
	@Query("UPDATE Card c SET c.position = c.position + 1 WHERE c.column.id = :columnId AND c.position >= :position")
	void shiftPositionsUp(@Param("columnId") Long columnId, @Param("position") int position);
}
