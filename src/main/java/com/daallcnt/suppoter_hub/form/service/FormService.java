package com.daallcnt.suppoter_hub.form.service;

import com.daallcnt.suppoter_hub.form.payload.FormDataDto;
import com.daallcnt.suppoter_hub.form.payload.SuppoterNode;
import org.springframework.http.ResponseEntity;

import java.util.List;

public interface FormService {
    void form(FormDataDto formDataDto, int pageNumber);

    ResponseEntity<List<SuppoterNode>> fetchTreeMap(int currentPage);

    ResponseEntity<List<Integer>> fetchPageNumberList();
}
