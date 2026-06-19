package com.example.taskmanagement.dto;

import com.example.taskmanagement.entity.ChecklistItem;
import lombok.Getter;

@Getter
public class ChecklistItemResponse {
    private final Long id;
    private final String text;
    private final Boolean completed;
    private final Integer position;

    public ChecklistItemResponse(ChecklistItem item) {
        this.id = item.getId();
        this.text = item.getText();
        this.completed = item.getCompleted();
        this.position = item.getPosition();
    }
}
