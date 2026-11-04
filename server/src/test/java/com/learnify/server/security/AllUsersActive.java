package com.learnify.server.security;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

/** Web-slice tests have no database, so every token's user counts as active. */
@TestConfiguration
public class AllUsersActive {
    @Bean
    public UserStatusChecker userStatusChecker() {
        return username -> true;
    }
}
