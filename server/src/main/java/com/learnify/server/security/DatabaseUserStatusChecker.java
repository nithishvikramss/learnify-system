package com.learnify.server.security;

import com.learnify.server.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class DatabaseUserStatusChecker implements UserStatusChecker {

    private final UserRepository userRepository;

    public DatabaseUserStatusChecker(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public boolean isActive(String username) {
        return userRepository.findByUsername(username).filter(u -> !u.isDisabled()).isPresent();
    }
}
