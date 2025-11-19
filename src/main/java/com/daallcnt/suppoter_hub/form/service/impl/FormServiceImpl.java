package com.daallcnt.suppoter_hub.form.service.impl;

import com.daallcnt.suppoter_hub.form.service.FormService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FormServiceImpl implements FormService {

    @Override
    public void form(int pageNumber) {

    }
}
