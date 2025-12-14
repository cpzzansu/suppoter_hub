package com.daallcnt.suppoter_hub.common.exception;

import com.daallcnt.suppoter_hub.form.payload.FormDataDto;

public class DuplicationSupporterException extends RuntimeException {
    public DuplicationSupporterException(String message) {
        super(message);
    }
}
