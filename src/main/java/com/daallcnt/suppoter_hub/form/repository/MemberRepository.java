package com.daallcnt.suppoter_hub.form.repository;

import com.daallcnt.suppoter_hub.form.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByMemberId(String username);
}
