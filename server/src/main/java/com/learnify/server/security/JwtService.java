package com.learnify.server.security;

import com.learnify.server.entity.Role;
import com.learnify.server.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

/** Issues and verifies signed (HMAC-SHA256) JSON Web Tokens for logged-in users. */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final int MIN_SECRET_BYTES = 32;

    private final SecretKey key;
    private final Duration expiration;

    public JwtService(@Value("${app.jwt.secret:}") String secret,
                      @Value("${app.jwt.expiration-minutes:120}") long expirationMinutes) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            // Safe fallback: a random key means tokens simply stop working after a restart.
            log.warn("JWT_SECRET is missing or shorter than {} bytes; using a random key for this run. "
                    + "Users will need to log in again after every restart.", MIN_SECRET_BYTES);
            this.key = Jwts.SIG.HS256.key().build();
        } else {
            this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        }
        this.expiration = Duration.ofMinutes(expirationMinutes);
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getUsername())
                .claim("role", user.getRole().name())
                .claim("name", user.getFullName())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expiration)))
                .signWith(key)
                .compact();
    }

    public Instant expiresAt(String token) {
        return parse(token).map(c -> c.getExpiration().toInstant()).orElseThrow();
    }

    /** Returns the authenticated identity in the token, or empty if it is invalid, tampered or expired. */
    public Optional<TokenUser> verify(String token) {
        return parse(token).flatMap(claims -> {
            try {
                return Optional.of(new TokenUser(claims.getSubject(), Role.valueOf(claims.get("role", String.class))));
            } catch (IllegalArgumentException | NullPointerException e) {
                return Optional.empty();
            }
        });
    }

    private Optional<Claims> parse(String token) {
        try {
            return Optional.of(Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public record TokenUser(String username, Role role) {}
}
