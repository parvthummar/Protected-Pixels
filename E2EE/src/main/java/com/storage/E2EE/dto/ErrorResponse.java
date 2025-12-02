package com.storage.E2EE.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorResponse {
    private boolean success;
    private String message;
    private String error;

    // Convenience constructor for error responses
    public ErrorResponse(String message) {
        this.success = false;
        this.message = message;
        this.error = message;
    }
}
