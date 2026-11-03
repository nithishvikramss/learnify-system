package com.learnify.server.controller;

import com.learnify.server.entity.Marks;
import com.learnify.server.exception.BadRequestException;
import com.learnify.server.service.MarksService;
import com.learnify.server.config.SecurityConfig;
import com.learnify.server.entity.Role;
import com.learnify.server.security.JwtService;
import com.learnify.server.security.TestTokens;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MarksController.class)
@Import({SecurityConfig.class, JwtService.class})
class MarksControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JwtService jwtService;

    private String teacher() {
        return TestTokens.bearer(jwtService, Role.TEACHER);
    }

    @MockitoBean
    private MarksService marksService;

    @Test
    void updateMarksReturnsUpdatedRecord() throws Exception {
        Marks updated = new Marks("stu1", "sub1", 30, 40);
        updated.setId("m1");
        when(marksService.updateMarks(eq("m1"), any())).thenReturn(updated);

        mvc.perform(put("/api/marks/m1").header(HttpHeaders.AUTHORIZATION, teacher()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"internalMarks\":30,\"externalMarks\":40}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalMarks").value(70.0));
    }

    @Test
    void negativeMarksAreRejected() throws Exception {
        mvc.perform(put("/api/marks/m1").header(HttpHeaders.AUTHORIZATION, teacher()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"internalMarks\":-5,\"externalMarks\":40}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.internalMarks").value("Internal marks cannot be negative"));
    }

    @Test
    void totalAboveMaxReturns400WithMessage() throws Exception {
        when(marksService.addOrUpdateMarks(any()))
                .thenThrow(new BadRequestException("Total marks (110) cannot exceed the maximum of 100 for Maths."));

        mvc.perform(post("/api/marks").header(HttpHeaders.AUTHORIZATION, teacher()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentId\":\"stu1\",\"subjectId\":\"sub1\",\"internalMarks\":60,\"externalMarks\":50}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Total marks (110) cannot exceed the maximum of 100 for Maths."));
    }

    @Test
    void deleteMarksReturnsMessage() throws Exception {
        mvc.perform(delete("/api/marks/m1").header(HttpHeaders.AUTHORIZATION, teacher()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Marks deleted successfully"));
        verify(marksService).deleteMarks("m1");
    }
}
