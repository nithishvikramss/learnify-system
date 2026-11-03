package com.learnify.server.controller;

import com.learnify.server.dto.LoginRequest;
import com.learnify.server.dto.LoginResponse;
import com.learnify.server.entity.User;
import com.learnify.server.exception.ApiException;
import com.learnify.server.exception.NotFoundException;
import com.learnify.server.repository.UserRepository;
import com.learnify.server.security.JwtService;
import com.learnify.server.security.LoginAttemptService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    /** Same message for unknown user and wrong password, so attackers cannot discover usernames. */
    private static final String BAD_CREDENTIALS = "Invalid username or password.";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginAttemptService loginAttempts;
    /** Hash checked when the user does not exist, so both cases take similar time. */
    private final String dummyHash;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder,
                          JwtService jwtService, LoginAttemptService loginAttempts) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.loginAttempts = loginAttempts;
        this.dummyHash = passwordEncoder.encode("dummy-password-for-timing");
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        String username = request.username().trim().toLowerCase(Locale.ROOT);
        if (loginAttempts.isLocked(username)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many failed attempts. Try again in 15 minutes.");
        }

        Optional<User> user = userRepository.findByUsername(username);
        boolean matches = passwordEncoder.matches(request.password(),
                user.map(User::getPasswordHash).orElse(dummyHash));
        if (user.isEmpty() || !matches) {
            loginAttempts.recordFailure(username);
            throw new ApiException(HttpStatus.UNAUTHORIZED, BAD_CREDENTIALS);
        }

        loginAttempts.recordSuccess(username);
        User u = user.get();
        String token = jwtService.generateToken(u);
        return ResponseEntity.ok(new LoginResponse(token, u.getUsername(), u.getFullName(),
                u.getRole().name(), jwtService.expiresAt(token)));
    }

    /** Returns the logged-in user's profile (used by the frontend to confirm a session is still valid). */
    @GetMapping("/me")
    public ResponseEntity<Map<String, String>> me(Authentication authentication) {
        User u = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new NotFoundException("User not found"));
        return ResponseEntity.ok(Map.of(
                "username", u.getUsername(),
                "fullName", u.getFullName(),
                "role", u.getRole().name()));
    }
}
