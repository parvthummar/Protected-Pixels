package com.storage.E2EE.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin
public class TestSecureController {

    @PostMapping("/secure/test")
    public String test() {
        return "✅ Access granted: JWT works";
    }
}
