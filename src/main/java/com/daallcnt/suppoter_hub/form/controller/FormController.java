package com.daallcnt.suppoter_hub.form.controller;

import com.daallcnt.suppoter_hub.form.payload.FormDataDto;
import com.daallcnt.suppoter_hub.form.payload.SuppoterNode;

import com.daallcnt.suppoter_hub.form.service.FormService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api")
public class FormController {

    private final FormService formService;

    @PostMapping("/form")
    public void form(@RequestBody FormDataDto formDataDto) {
        log.debug("formDataDto: {}, pageNumber: {}", formDataDto);
        formService.form(formDataDto);
    }

    @GetMapping("/fetchTreeMap")
    public ResponseEntity<List<SuppoterNode>> fetchTreeMap(@RequestParam(name = "currentPage") int currentPage) {
        log.debug("fetchTreeMap currentPage: {}", currentPage);
        return formService.fetchTreeMap(currentPage);
    }

    @GetMapping("/fetchPageNumberList")
    public ResponseEntity<List<Integer>> fetchPageNumberList() {
        log.debug("fetchPageNumberList");
        return formService.fetchPageNumberList();
    }

    @GetMapping("/fetchSheetSupporter")
    public ResponseEntity<List<SuppoterNode>> fetchSheetSupporter() {
        log.debug("fetchSheetSupporter");
        return formService.fetchSheetSupporter();
    }

}
