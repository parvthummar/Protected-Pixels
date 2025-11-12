package com.storage.E2EE.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SigninResponse {
    private String enc_masterkey;
    private String enc_verificationkey;
}
