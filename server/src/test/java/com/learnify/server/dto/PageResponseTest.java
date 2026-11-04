package com.learnify.server.dto;

import com.learnify.server.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PageResponseTest {

    private static final List<Integer> ITEMS = IntStream.rangeClosed(1, 25).boxed().toList();

    @Test
    void firstMiddleAndLastPages() {
        assertThat(PageResponse.of(ITEMS, 0, 10).content()).startsWith(1).hasSize(10);
        assertThat(PageResponse.of(ITEMS, 1, 10).content()).startsWith(11).hasSize(10);
        assertThat(PageResponse.of(ITEMS, 2, 10).content()).containsExactly(21, 22, 23, 24, 25);
    }

    @Test
    void totalsAreCorrect() {
        PageResponse<Integer> p = PageResponse.of(ITEMS, 0, 10);
        assertThat(p.totalElements()).isEqualTo(25);
        assertThat(p.totalPages()).isEqualTo(3);
        assertThat(PageResponse.of(List.of(1, 2), 0, 2).totalPages()).isEqualTo(1);
    }

    @Test
    void pageBeyondTheEndIsEmptyNotAnError() {
        assertThat(PageResponse.of(ITEMS, 9, 10).content()).isEmpty();
        assertThat(PageResponse.of(List.of(), 0, 10).totalPages()).isZero();
    }

    @Test
    void hugePageNumberDoesNotOverflow() {
        assertThat(PageResponse.of(ITEMS, Integer.MAX_VALUE, 100).content()).isEmpty();
    }

    @Test
    void invalidArgumentsAreRejected() {
        assertThatThrownBy(() -> PageResponse.of(ITEMS, -1, 10)).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> PageResponse.of(ITEMS, 0, 0)).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> PageResponse.of(ITEMS, 0, 101)).isInstanceOf(BadRequestException.class);
    }
}
