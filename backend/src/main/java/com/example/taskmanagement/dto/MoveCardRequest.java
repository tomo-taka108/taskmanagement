package com.example.taskmanagement.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MoveCardRequest {

    @NotNull
    private Long targetColumnId;

    @NotNull
    private Integer newPosition;
}
