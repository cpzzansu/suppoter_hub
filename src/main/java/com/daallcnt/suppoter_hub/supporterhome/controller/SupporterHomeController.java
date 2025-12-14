package com.daallcnt.suppoter_hub.supporterhome.controller;

import com.daallcnt.suppoter_hub.form.payload.LoginResponseDto;
import com.daallcnt.suppoter_hub.form.payload.SuppoterNode;
import com.daallcnt.suppoter_hub.supporterhome.payload.FormDataDto;
import com.daallcnt.suppoter_hub.supporterhome.payload.SupporterHomeLoginDto;
import com.daallcnt.suppoter_hub.supporterhome.service.SupporterHomeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/supporterHome")
public class SupporterHomeController {

    private final SupporterHomeService supporterHomeService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody SupporterHomeLoginDto loginDto) {
        log.debug("loginDto: {}",  loginDto);
        return supporterHomeService.login(loginDto);
    }

    @GetMapping("/fetchModifyInfo")
    public ResponseEntity<SuppoterNode>  getModifyInfo(@RequestParam long id) {
        log.debug("getModifyInfo id: {}", id);
        return supporterHomeService.getModifyInfo(id);
    }

    @GetMapping("/findRecommend")
    public ResponseEntity<List<SuppoterNode>>  findRecommend(@RequestParam String recommend) {
        log.debug("findRecommend recommend: {}", recommend);
        return supporterHomeService.findRecommend(recommend);
    }

    @PutMapping("/modifyForm")
    public void modifyForm(@RequestBody FormDataDto formDataDto) {
        log.debug("modifyForm: {}", formDataDto);
        supporterHomeService.modifyForm(formDataDto);
    }

    @GetMapping("/fetchRecommendMissing")
    public ResponseEntity<List<SuppoterNode>>  fetchRecommendMissing() {
        log.debug("fetchRecommendMissing");
        return supporterHomeService.fetchRecommendMissing();
    }

}
