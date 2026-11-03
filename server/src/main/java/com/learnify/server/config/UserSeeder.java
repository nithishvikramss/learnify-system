package com.learnify.server.config;

import com.learnify.server.entity.Role;
import com.learnify.server.entity.User;
import com.learnify.server.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Creates the initial admin and teacher accounts on startup if they do not exist yet.
 * Credentials come from environment variables / server/.env, never from source code.
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class UserSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(UserSeeder.class);
    private static final int MIN_PASSWORD_LENGTH = 8;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-username:admin}") private String adminUsername;
    @Value("${app.seed.admin-password:}") private String adminPassword;
    @Value("${app.seed.teacher-username:teacher}") private String teacherUsername;
    @Value("${app.seed.teacher-password:}") private String teacherPassword;

    public UserSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        createIfMissing(adminUsername, adminPassword, "Administrator", Role.ADMIN, "APP_ADMIN_PASSWORD");
        createIfMissing(teacherUsername, teacherPassword, "Teacher", Role.TEACHER, "APP_TEACHER_PASSWORD");
    }

    private void createIfMissing(String username, String password, String fullName, Role role, String envName) {
        String name = username.trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByUsername(name)) {
            return;
        }
        if (password == null || password.length() < MIN_PASSWORD_LENGTH) {
            log.warn("Skipping creation of {} account '{}': set {} (at least {} characters) in server/.env",
                    role, name, envName, MIN_PASSWORD_LENGTH);
            return;
        }
        userRepository.save(new User(name, passwordEncoder.encode(password), fullName, role));
        log.info("Created {} account '{}'", role, name);
    }
}
