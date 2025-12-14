package com.daallcnt.suppoter_hub.form.service;

import com.daallcnt.suppoter_hub.form.payload.FormDataDto;
import com.daallcnt.suppoter_hub.form.payload.SuppoterNode;
import org.springframework.http.ResponseEntity;

import java.util.List;

public interface FormService {
    void form(FormDataDto formDataDto);

    ResponseEntity<List<SuppoterNode>> fetchTreeMap(int currentPage);

    ResponseEntity<List<Integer>> fetchPageNumberList();

    ResponseEntity<List<SuppoterNode>> fetchSheetSupporter();

    ResponseEntity<SuppoterNode> fetchLeaderNode(Long leaderId);
}
