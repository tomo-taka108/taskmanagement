package com.example.taskmanagement.repository;

import com.example.taskmanagement.entity.ChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChecklistItemRepository extends JpaRepository<ChecklistItem, Long> {
    List<ChecklistItem> findByCardIdOrderByPositionAsc(Long cardId);
}
