package com.daallcnt.suppoter_hub.form.controller;

import com.daallcnt.suppoter_hub.form.payload.*;

import com.daallcnt.suppoter_hub.form.service.FormService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api")
public class FormController {

    private final FormService formService;

    @PostMapping("/form")
    public void form(@RequestBody FormDataDto formDataDto, HttpServletRequest request) throws IOException, InterruptedException {
        log.debug("formDataDto: {}, pageNumber: {}", formDataDto);
        formService.form(formDataDto, request);
    }

    @GetMapping("/fetchTreeMap")
    public ResponseEntity<AdminHomeDto> fetchTreeMap(@RequestParam(name = "currentPage") int currentPage) {
        log.debug("fetchTreeMap currentPage: {}", currentPage);
        return formService.fetchTreeMap(currentPage);
    }

    @GetMapping("/fetchLeaderNode")
    public ResponseEntity<SuppoterNode> fetchLeaderNode(@RequestParam(name = "leaderId") Long leaderId) {
        log.debug("fetchLeaderNode leaderId: {}", leaderId);
        return formService.fetchLeaderNode(leaderId);
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

    @GetMapping("/fetchSheetForLeader")
    public ResponseEntity<List<SuppoterNode>> fetchSheetForLeader(@RequestParam Long leaderId) {
        log.debug("fetchSheetForLeader  leaderId: {}", leaderId);
        return formService.fetchSheetForLeader(leaderId);
    }

    @GetMapping("/fetchRanking")
    public ResponseEntity<List<RecommendRankView>> fetchRanking() {
        log.debug("fetchRanking");
        return formService.fetchRanking();
    }

    @GetMapping("/fetchRegion")
    public ResponseEntity<List<RegionView>> fetchRegion(@RequestParam(name = "region")String region) {
        log.debug("fetchRegion region: {}", region);
        return formService.fetchRegion(region);
    }

    @GetMapping("/fetchRightMember")
    public ResponseEntity<List<RegionView>> fetchRightMember() {
        log.debug("fetchRightMember");
        return formService.fetchRightMember();
    }
}
