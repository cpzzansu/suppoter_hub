package com.daallcnt.suppoter_hub.form.controller;

import com.daallcnt.suppoter_hub.form.payload.*;

import com.daallcnt.suppoter_hub.form.service.FormService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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
    public ResponseEntity<Page<RegionRowDto>> fetchRegion(@RequestParam(name = "region") String region,
                                                        @RequestParam(name = "keyword") String keyword,
                                                        @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        log.debug("fetchRegion region: {}, keyword: {}", region, keyword);
        String kw = (keyword == null) ? null : keyword.trim();
        if (kw != null && kw.isEmpty()) kw = null;

        return formService.fetchRegion(region, kw, pageable);
    }

    @GetMapping("/fetchRightMember")
    public ResponseEntity<List<RegionRowView>> fetchRightMember() {
        log.debug("fetchRightMember");
        return formService.fetchRightMember();
    }

    @GetMapping("/fetchRegionExcel")
    public ResponseEntity<List<RegionRowView>> fetchRegionExcel(@RequestParam(name = "region") String region,
                                                                @RequestParam(name = "keyword") String keyword) {

        log.debug("fetchRegionExcel region: {}, keyword: {}", region, keyword);
        return formService.fetchRegionExcel(region, keyword);
    }
}
