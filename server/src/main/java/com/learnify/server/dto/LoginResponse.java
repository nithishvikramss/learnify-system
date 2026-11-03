package com.learnify.server.dto;

import java.time.Instant;

public record LoginResponse(String token, String username, String fullName, String role, Instant expiresAt) {}
