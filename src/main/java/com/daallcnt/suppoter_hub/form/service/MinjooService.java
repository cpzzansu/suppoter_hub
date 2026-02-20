package com.daallcnt.suppoter_hub.form.service;

import com.daallcnt.suppoter_hub.form.payload.MinjooRegisterRequest;
import com.daallcnt.suppoter_hub.form.payload.MinjooRegisterResponse;

public interface MinjooService {
    MinjooRegisterResponse register(MinjooRegisterRequest request);
}
