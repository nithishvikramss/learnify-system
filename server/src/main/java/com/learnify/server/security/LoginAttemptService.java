package com.learnify.server.security;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple brute-force protection: {@value #MAX_FAILURES} wrong passwords within {@link #WINDOW}
 * lock a username for {@link #LOCK_DURATION}. Failures older than the window are forgotten.
 * State is in memory, which is enough for a single server.
 */
@Component
public class LoginAttemptService {

    static final int MAX_FAILURES = 5;
    static final Duration WINDOW = Duration.ofMinutes(15);
    static final Duration LOCK_DURATION = Duration.ofMinutes(15);
    /** Above this many tracked usernames, stale entries are purged so the map cannot grow without limit. */
    private static final int PURGE_THRESHOLD = 10_000;

    private final Map<String, Attempts> attempts = new ConcurrentHashMap<>();
    private final Clock clock;

    public LoginAttemptService() {
        this(Clock.systemUTC());
    }

    LoginAttemptService(Clock clock) {
        this.clock = clock;
    }

    public boolean isLocked(String username) {
        Attempts a = attempts.get(username);
        if (a == null || a.lockedUntil == null) return false;
        if (clock.instant().isAfter(a.lockedUntil)) {
            attempts.remove(username);
            return false;
        }
        return true;
    }

    public void recordFailure(String username) {
        Instant now = clock.instant();
        if (attempts.size() > PURGE_THRESHOLD) {
            attempts.values().removeIf(a -> a.isStale(now));
        }
        attempts.compute(username, (u, a) -> {
            Attempts current = (a == null || a.isStale(now)) ? new Attempts(0, now, null) : a;
            int failures = current.failures + 1;
            Instant lockedUntil = failures >= MAX_FAILURES ? now.plus(LOCK_DURATION) : null;
            return new Attempts(failures, current.windowStart, lockedUntil);
        });
    }

    public void recordSuccess(String username) {
        attempts.remove(username);
    }

    private record Attempts(int failures, Instant windowStart, Instant lockedUntil) {
        /** True when the counting window has passed and the account is not (or no longer) locked. */
        boolean isStale(Instant now) {
            boolean lockOver = lockedUntil == null || now.isAfter(lockedUntil);
            return lockOver && now.isAfter(windowStart.plus(WINDOW));
        }
    }
}
