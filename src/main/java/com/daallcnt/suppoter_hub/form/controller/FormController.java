package com.daallcnt.suppoter_hub.form.controller;

import com.daallcnt.suppoter_hub.form.payload.FormDataDto;
import com.daallcnt.suppoter_hub.form.service.FormService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/form")
public class FormController {

    private final FormService formService;

    @PostMapping("")
    public void form(@RequestBody FormDataDto formDataDto, @RequestParam(name = "pageNumber") int pageNumber) {
        log.debug("formDataDto: {}, pageNumber: {}", formDataDto, pageNumber);
        formService.form(pageNumber);
    }

}
