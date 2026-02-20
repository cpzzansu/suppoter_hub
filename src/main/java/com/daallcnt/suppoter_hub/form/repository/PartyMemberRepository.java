package com.daallcnt.suppoter_hub.form.repository;

import com.daallcnt.suppoter_hub.form.entity.PartyMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface PartyMemberRepository extends JpaRepository<PartyMember, Long> {

    @Query("SELECT p FROM PartyMember p WHERE p.phone IS NOT NULL AND LENGTH(TRIM(p.phone)) > 0")
    List<PartyMember> findAllWithPhone();

    @Query("SELECT p FROM PartyMember p WHERE p.phone IN :phones")
    List<PartyMember> findByPhoneIn(@Param("phones") Collection<String> phones);
}
