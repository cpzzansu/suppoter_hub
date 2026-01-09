package com.daallcnt.suppoter_hub.form.repository;

import com.daallcnt.suppoter_hub.form.entity.SupporterSignupLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface SupporterSignupLogRepository extends JpaRepository<SupporterSignupLog, Long> {
    boolean existsByIpAndDay(String ip, LocalDate day);
}
