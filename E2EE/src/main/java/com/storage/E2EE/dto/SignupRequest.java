package com.storage.E2EE.dto;

import lombok.Data;

@Data
public class SignupRequest {
    private String username;
    private String email;
    private String enc_masterkey;
    private String enc_verificationkey;
    private String plain_verificationkey;
}
