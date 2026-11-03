package com.learnify.server.security;

import com.learnify.server.entity.Role;
import com.learnify.server.entity.User;

/** Builds real signed tokens for controller tests. */
public final class TestTokens {

    private TestTokens() {}

    public static String bearer(JwtService jwtService, Role role) {
        User user = new User(role.name().toLowerCase(), "unused", "Test " + role, role);
        return "Bearer " + jwtService.generateToken(user);
    }
}
