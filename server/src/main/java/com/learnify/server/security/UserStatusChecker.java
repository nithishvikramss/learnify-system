package com.learnify.server.security;

/** Decides whether a valid token's user may still act (the account exists and is not disabled). */
public interface UserStatusChecker {
    boolean isActive(String username);
}
