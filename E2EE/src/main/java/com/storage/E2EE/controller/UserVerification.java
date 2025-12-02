package com.storage.E2EE.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.storage.E2EE.dto.*;
import com.storage.E2EE.security.JwtService;
import com.storage.E2EE.services.UserRepositoryService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class UserVerification {

    @Autowired
    private UserRepositoryService userRepositoryService;

    @PostMapping("/signup")
    public ResponseEntity<?> registration(@RequestBody SignupRequest req) {
        try {
            userRepositoryService.signup(req);
            return ResponseEntity.ok(new SuccessResponse("Account created successfully"));
        } catch (IllegalArgumentException ex) {
            // Return proper JSON error response for duplicate username or validation errors
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        } catch (Exception ex) {
            // Catch any other unexpected errors
            return ResponseEntity.status(500)
                    .body(new ErrorResponse("An unexpected error occurred. Please try again."));
        }
    }

    @PostMapping("/signin")
    public ResponseEntity<?> login(@RequestBody SigninRequest req) {
        try {
            SigninResponse resp = userRepositoryService.signin(req.getUsername());
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException ex) {
            // Return proper JSON error response for user not found
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        } catch (Exception ex) {
            // Catch any other unexpected errors
            return ResponseEntity.status(500)
                    .body(new ErrorResponse("An unexpected error occurred. Please try again."));
        }
    }

    // Step 2 of login: client proves it by sending decrypted verification key
    // @PostMapping("/verify")
    // public ResponseEntity<VerifyResponse> verify(@RequestBody VerifyRequest req){
    // boolean ok = userRepositoryService.verify(req.getUsername(),
    // req.getVerificationKey());
    // if (ok) {
    // return ResponseEntity.ok(new VerifyResponse(true, "verified"));
    // }
    // return ResponseEntity.status(401).body(new VerifyResponse(false, "invalid
    // verification key"));
    // }

    @Autowired
    private JwtService jwtService;

    @PostMapping("/verify")
    public ResponseEntity<VerifyResponse> verify(@RequestBody VerifyRequest req) {
        boolean ok = userRepositoryService.verify(req.getUsername(), req.getVerificationKey());

        if (ok) {
            String jwt = jwtService.generateToken(req.getUsername());
            return ResponseEntity.ok(new VerifyResponse(true, jwt));
        }

        return ResponseEntity.status(401).body(new VerifyResponse(false, "invalid verification key"));
    }

}
