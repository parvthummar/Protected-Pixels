package com.storage.E2EE.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;

import java.security.Key;
import java.util.Base64;
import java.util.Date;

import org.springframework.stereotype.Service;

@Service
public class JwtService {

    // 256-bit Base64 key (keep secret!)
    private static final String SECRET = "NApbIPTIPy2g059Ce9Q2qs/WwWoVESA1wyJTUS5+J28=";

    private final Key key = Keys.hmacShaKeyFor(Base64.getDecoder().decode(SECRET));

    public String generateToken(String username) {
        long expirationMillis = 1000L * 60 * 60; // 1h
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMillis))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /** Parse + fully validate (signature + expiry). Returns username if valid. */
    public String validateAndExtractUsername(String token) {
        Jws<Claims> jws = Jwts.parserBuilder()
                .setSigningKey(key) // <-- signature validation happens here
                .build()
                .parseClaimsJws(token);
        return jws.getBody().getSubject();
    }
}
