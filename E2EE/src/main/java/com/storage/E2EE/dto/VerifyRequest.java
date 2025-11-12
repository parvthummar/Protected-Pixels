package com.storage.E2EE.dto;

import lombok.Data;

@Data
public class VerifyRequest {
    private String username;
    private String verificationKey; 
}
