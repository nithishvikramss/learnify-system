package com.learnify.server.dto;

import com.learnify.server.exception.BadRequestException;

import java.util.List;

/** One page of a list, plus the totals the UI needs to show page controls. */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static final int MAX_SIZE = 100;

    /** Cuts one page out of an already filtered list. Page numbers start at 0. */
    public static <T> PageResponse<T> of(List<T> all, int page, int size) {
        if (page < 0) {
            throw new BadRequestException("page cannot be negative.");
        }
        if (size < 1 || size > MAX_SIZE) {
            throw new BadRequestException("size must be between 1 and " + MAX_SIZE + ".");
        }
        int from = (int) Math.min((long) page * size, all.size());
        int to = (int) Math.min((long) from + size, all.size());
        int totalPages = (int) Math.ceil((double) all.size() / size);
        return new PageResponse<>(List.copyOf(all.subList(from, to)), page, size, all.size(), totalPages);
    }
}
