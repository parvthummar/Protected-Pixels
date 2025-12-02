package com.storage.E2EE.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SuccessResponse {
    private boolean success;
    private String message;

    public SuccessResponse(String message) {
        this.success = true;
        this.message = message;
    }
}
