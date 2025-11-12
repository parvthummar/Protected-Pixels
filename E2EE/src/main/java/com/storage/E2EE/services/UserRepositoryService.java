package com.storage.E2EE.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.storage.E2EE.dto.SigninResponse;
import com.storage.E2EE.dto.SignupRequest;
import com.storage.E2EE.models.Users;
import com.storage.E2EE.repositories.UserRepository;

@Service
public class UserRepositoryService {

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void signup(SignupRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        Users u = new Users();
        u.setUsername(req.getUsername());
        u.setEmail(req.getEmail());
        u.setEnc_masterkey(req.getEnc_masterkey());
        u.setEnc_verificationkey(req.getEnc_verificationkey());
        u.setPlain_verificationkey(req.getPlain_verificationkey()); // stored as-is per your design

        userRepository.save(u);
    }

    @Transactional(readOnly = true)
    public SigninResponse signin(String username) {
        Users u = userRepository.findByUsername(username);
        if (u == null) {
            throw new IllegalArgumentException("User not found");
        }
        return new SigninResponse(u.getEnc_masterkey(), u.getEnc_verificationkey());
    }

    @Transactional(readOnly = true)
    public boolean verify(String username, String verificationKeyCandidate) {
        Users u = userRepository.findByUsername(username);
        if (u == null) return false;

        // Constant-time comparison to reduce timing side-channels
        return constantTimeEquals(
            u.getPlain_verificationkey(),
            verificationKeyCandidate
        );
    }

    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) return false;
        byte[] x = a.getBytes();
        byte[] y = b.getBytes();
        if (x.length != y.length) return false;

        int res = 0;
        for (int i = 0; i < x.length; i++) {
            res |= (x[i] ^ y[i]);
        }
        return res == 0;
    }
}
