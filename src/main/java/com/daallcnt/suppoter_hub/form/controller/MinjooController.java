package com.daallcnt.suppoter_hub.form.controller;

import com.daallcnt.suppoter_hub.form.payload.MinjooRegisterRequest;
import com.daallcnt.suppoter_hub.form.payload.MinjooRegisterResponse;
import com.daallcnt.suppoter_hub.form.service.MinjooService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MinjooController {

    private final MinjooService minjooService;

    @PostMapping("/minjoo/register")
    public ResponseEntity<MinjooRegisterResponse> register(@RequestBody MinjooRegisterRequest request) {
        return ResponseEntity.ok(minjooService.register(request));
    }
}
