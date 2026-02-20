package com.daallcnt.suppoter_hub.form.repository;

import com.daallcnt.suppoter_hub.form.entity.Minjoo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MinjooRepository extends JpaRepository<Minjoo, Long> {
    boolean existsByPhone(String phone);
}
